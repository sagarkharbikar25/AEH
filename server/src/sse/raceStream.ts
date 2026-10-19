/**
 * POLARIS Real-Time Race SSE Stream Manager
 *
 * Manages Server-Sent Events (SSE) connections and dispatches live telemetry events
 * (stage progression, tool selection, token counts, final savings comparison)
 * to connected frontend clients.
 */

import { Response } from 'express';
import { EventEmitter } from 'node:events';
import { LaneResult } from '../agent/types.js';
import { SavingsComparison } from '../agent/pricing.js';

export interface RaceEvent {
  type: 'race:init' | 'lane:stage' | 'lane:result' | 'race:complete' | 'race:error';
  raceId: string;
  timestamp: string;
  data: any;
}

export interface RaceSession {
  raceId: string;
  query: string;
  modelId: string;
  startTime: number;
  laneA?: LaneResult;
  laneB?: LaneResult;
  savings?: SavingsComparison;
  isComplete: boolean;
  error?: string;
  events: RaceEvent[];
}

class RaceStreamManager extends EventEmitter {
  private sessions = new Map<string, RaceSession>();
  private clientConnections = new Map<string, Set<Response>>();

  public createSession(raceId: string, query: string, modelId: string = 'anthropic.claude-3-haiku-20240307-v1:0'): RaceSession {
    const session: RaceSession = {
      raceId,
      query,
      modelId,
      startTime: Date.now(),
      isComplete: false,
      events: [],
    };
    this.sessions.set(raceId, session);
    this.clientConnections.set(raceId, new Set<Response>());

    // Auto cleanup after 15 minutes
    setTimeout(() => {
      this.sessions.delete(raceId);
      this.clientConnections.delete(raceId);
    }, 15 * 60 * 1000);

    return session;
  }

  public getSession(raceId: string): RaceSession | undefined {
    return this.sessions.get(raceId);
  }

  public registerClient(raceId: string, res: Response): void {
    const clients = this.clientConnections.get(raceId) || new Set<Response>();
    clients.add(res);
    this.clientConnections.set(raceId, clients);

    // Send headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    // Replay historical events for late-joining clients
    const session = this.sessions.get(raceId);
    if (session) {
      for (const ev of session.events) {
        res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`);
      }
      if (session.isComplete) {
        res.end();
        return;
      }
    }

    // Keepalive heartbeat every 15s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    // Handle disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });
  }

  public emitEvent(raceId: string, type: RaceEvent['type'], data: any): void {
    const session = this.sessions.get(raceId);
    const event: RaceEvent = {
      type,
      raceId,
      timestamp: new Date().toISOString(),
      data,
    };

    if (session) {
      session.events.push(event);
      if (type === 'lane:result') {
        if (data.lane === 'laneA') session.laneA = data;
        if (data.lane === 'laneB') session.laneB = data;
      }
      if (type === 'race:complete') {
        session.isComplete = true;
        session.savings = data.savings;
      }
      if (type === 'race:error') {
        session.isComplete = true;
        session.error = data.message;
      }
    }

    const clients = this.clientConnections.get(raceId);
    if (clients) {
      const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const client of clients) {
        client.write(payload);
        if (type === 'race:complete' || type === 'race:error') {
          client.end();
        }
      }
    }
  }
}

export const raceStream = new RaceStreamManager();
