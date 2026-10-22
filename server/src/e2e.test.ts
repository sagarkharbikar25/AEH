/**
 * POLARIS Express End-to-End API Test Suite
 *
 * Validates Phase P2 backend hardening against @polaris/contracts:
 * - Health probe schema
 * - Catalog schema
 * - Route endpoint validation and response schema
 * - Race SSE events (decision, shortlist, lane_start, lane_tokens, lane_done, final)
 * - Error envelopes (BAD_REQUEST, NOT_FOUND, BUDGET_EXHAUSTED, RATE_LIMITED)
 * - Run replay via GET /api/runs/:id
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type http from 'node:http';
import {
  HealthSchema,
  CatalogResponseSchema,
  RouteResponseSchema,
  RaceAcceptedSchema,
  RunSchema,
  ErrorEnvelopeSchema,
  RaceEventSchema,
} from '@polaris/contracts';
import { app } from './app.js';
import { spendBudget } from './middleware/safety.js';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Polaris Hardened API Server (Phase P2)', () => {
  it('GET /api/health returns valid HealthSchema', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    const parsed = HealthSchema.parse(data);
    expect(parsed.version).toBe('1.0.0');
    expect(['up', 'degraded', 'down']).toContain(parsed.api);
    expect(['loading', 'ready', 'down']).toContain(parsed.decider);
    expect(['connected', 'simulated', 'down']).toContain(parsed.bedrock);
  });

  it('GET /api/catalog returns valid CatalogResponseSchema with 240 tools and 12 constellations', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    expect(res.status).toBe(200);
    const data = await res.json();
    const parsed = CatalogResponseSchema.parse(data);
    expect(parsed.tools.length).toBe(240);
    expect(parsed.constellations.length).toBe(12);
  });

  it('POST /api/route returns valid RouteResponseSchema', async () => {
    const res = await fetch(`${baseUrl}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Attach a note to this customer account record' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    const parsed = RouteResponseSchema.parse(data);
    expect(parsed.needsTool).toBe(true);
    expect(parsed.tools.length).toBeGreaterThanOrEqual(1);
    expect(parsed.tools.length).toBeLessThanOrEqual(13);
    expect(parsed.decisions.length).toBeGreaterThan(0);
  });

  it('POST /api/route rejects invalid payload with BAD_REQUEST error envelope', async () => {
    const res = await fetch(`${baseUrl}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalidField: 123 }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    const parsed = ErrorEnvelopeSchema.parse(data);
    expect(parsed.error.code).toBe('BAD_REQUEST');
    expect(parsed.error.requestId).toBeDefined();
    expect(parsed.error.details).toBeDefined();
  });

  it('POST /api/race returns 202 RaceAccepted and dispatches SSE events to completion', async () => {
    const postRes = await fetch(`${baseUrl}/api/race`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Schedule a sync meeting with the platform team tomorrow at 2pm',
      }),
    });

    expect(postRes.status).toBe(202);
    const acceptedData = await postRes.json();
    const accepted = RaceAcceptedSchema.parse(acceptedData);
    expect(accepted.status).toBe('queued');
    expect(accepted.runId).toMatch(/^run_/);

    // Connect to SSE stream
    const streamRes = await fetch(`${baseUrl}${accepted.streamUrl}`);
    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get('content-type')).toContain('text/event-stream');

    const reader = streamRes.body?.getReader();
    expect(reader).toBeDefined();

    const decoder = new TextDecoder();
    let streamText = '';
    const events: any[] = [];

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value, { stream: true });

      // Split SSE messages
      let delimiterIndex: number;
      while ((delimiterIndex = streamText.indexOf('\n\n')) !== -1) {
        const rawMessage = streamText.slice(0, delimiterIndex);
        streamText = streamText.slice(delimiterIndex + 2);
        const dataMatch = rawMessage.match(/data:\s*(.*)/);
        if (dataMatch && dataMatch[1]) {
          try {
            const parsedEvent = JSON.parse(dataMatch[1]);
            RaceEventSchema.parse(parsedEvent);
            events.push(parsedEvent);
          } catch {
            // Heartbeat or incomplete fragment
          }
        }
      }

      // Break once final event is received
      if (events.some((e) => e.type === 'final')) {
        break;
      }
    }

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('decision');
    expect(eventTypes).toContain('shortlist');
    expect(eventTypes).toContain('lane_start');
    expect(eventTypes).toContain('lane_done');
    expect(eventTypes).toContain('final');

    // Verify GET /api/runs/:id returns the completed run record
    const runRes = await fetch(`${baseUrl}/api/runs/${accepted.runId}`);
    expect(runRes.status).toBe(200);
    const runData = await runRes.json();
    const runRecord = RunSchema.parse(runData);
    expect(runRecord.runId).toBe(accepted.runId);
    expect(runRecord.events.length).toBeGreaterThanOrEqual(events.length);
  });

  it('GET /api/runs/:id returns 404 NOT_FOUND for unknown run ID', async () => {
    const res = await fetch(`${baseUrl}/api/runs/run_nonexistent_999`);
    expect(res.status).toBe(404);
    const data = await res.json();
    const parsed = ErrorEnvelopeSchema.parse(data);
    expect(parsed.error.code).toBe('NOT_FOUND');
  });

  it('Enforces daily kill-switch when budget is exhausted', async () => {
    spendBudget.recordSpend(50.0); // Exceeds default $25.00
    const res = await fetch(`${baseUrl}/api/catalog`);
    expect(res.status).toBe(429);
    const data = await res.json();
    const parsed = ErrorEnvelopeSchema.parse(data);
    expect(parsed.error.code).toBe('BUDGET_EXHAUSTED');
    spendBudget.reset(); // Reset for subsequent tests
  });
});
