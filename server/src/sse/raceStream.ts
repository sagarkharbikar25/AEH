/**
 * POLARIS Real-Time Race SSE Stream Manager
 *
 * Implements strict conformance to @polaris/contracts SSE schema:
 * Exactly seven event types:
 * - decision
 * - shortlist
 * - lane_start
 * - lane_tokens
 * - lane_done
 * - final
 * - error
 *
 * Every event contains runId, monotonic seq, and ISO ts.
 */

import { type Response } from 'express';
import { EventEmitter } from 'node:events';
import {
  type RaceEvent,
  RaceEventSchema,
  type Run,
} from '@polaris/contracts';
import { runsRepository } from '../db/runsRepository.js';

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type RaceEventPayload = DistributiveOmit<RaceEvent, 'runId' | 'seq' | 'ts'>;

export interface RaceSession {
  runId: string;
  requestId: string;
  query: string;
  modelId: string;
  createdAt: string;
  seq: number;
  isComplete: boolean;
  events: RaceEvent[];
}

class RaceStreamManager extends EventEmitter {
  private sessions = new Map<string, RaceSession>();
  private clientConnections = new Map<string, Set<Response>>();

  public createSession(
    runId: string,
    query: string,
    requestId: string = 'req_unknown',
    modelId: string = 'anthropic.claude-3-haiku-20240307-v1:0'
  ): RaceSession {
    const session: RaceSession = {
      runId,
      requestId,
      query,
      modelId,
      createdAt: new Date().toISOString(),
      seq: 0,
      isComplete: false,
      events: [],
    };

    this.sessions.set(runId, session);
    this.clientConnections.set(runId, new Set<Response>());

    // Auto cleanup in-memory session after 20 minutes
    setTimeout(() => {
      this.sessions.delete(runId);
      this.clientConnections.delete(runId);
    }, 20 * 60 * 1000);

    return session;
  }

  public getSession(runId: string): RaceSession | undefined {
    return this.sessions.get(runId);
  }

  public registerClient(runId: string, res: Response): void {
    const clients = this.clientConnections.get(runId) || new Set<Response>();
    clients.add(res);
    this.clientConnections.set(runId, clients);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const session = this.sessions.get(runId);
    if (session) {
      // Replay existing events to newly connected client
      for (const ev of session.events) {
        res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
      }
      if (session.isComplete) {
        res.end();
        return;
      }
    }

    // Keepalive heartbeat
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    res.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });
  }

  /**
   * Dispatches a typed RaceEvent to connected SSE clients and appends to run history.
   */
  public emitEvent(
    runId: string,
    eventPayload: RaceEventPayload
  ): RaceEvent {
    const session = this.sessions.get(runId);
    const seq = session ? session.seq++ : 0;
    const ts = new Date().toISOString();

    const fullEvent = {
      ...eventPayload,
      runId,
      seq,
      ts,
    } as RaceEvent;

    // Validate against contract schema
    RaceEventSchema.parse(fullEvent);

    if (session) {
      session.events.push(fullEvent);

      if (fullEvent.type === 'final' || fullEvent.type === 'error') {
        session.isComplete = true;
        const runRecord: Run = {
          runId: session.runId,
          requestId: session.requestId,
          query: session.query,
          createdAt: session.createdAt,
          events: session.events,
        };
        runsRepository.saveRun(runRecord).catch((err) => {
          console.warn(`[RaceStream] Could not save run ${runId}:`, err);
        });
      }
    }

    const clients = this.clientConnections.get(runId);
    if (clients) {
      const sseMessage = `event: ${fullEvent.type}\ndata: ${JSON.stringify(fullEvent)}\n\n`;
      for (const client of clients) {
        client.write(sseMessage);
        if (fullEvent.type === 'final' || fullEvent.type === 'error') {
          client.end();
        }
      }
    }

    return fullEvent;
  }
}

export const raceStream = new RaceStreamManager();
