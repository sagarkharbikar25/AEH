/**
 * POLARIS Express End-to-End API Test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from './app.js';
import http from 'node:http';

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

describe('Polaris API Server E2E', () => {
  it('GET /api/health returns system readiness', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('ok');
    expect(data.toolsCount).toBe(240);
    expect(data.services.router).toBe('ready');
  });

  it('GET /api/catalog returns all 240 tools and 12 constellations', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.totalTools).toBe(240);
    expect(data.constellations.length).toBe(12);
  });

  it('POST /api/route returns Decider 2B shortlist', async () => {
    const res = await fetch(`${baseUrl}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Launch a compute server in us-east-1' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.candidateCount).toBeGreaterThanOrEqual(1);
    expect(data.candidateCount).toBeLessThanOrEqual(6);
    expect(data.tools[0].category).toBe('compute');
  });

  it('POST /api/race (sync) runs Lane A vs Lane B and returns savings scoreboard', async () => {
    const res = await fetch(`${baseUrl}/api/race`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Schedule a sync meeting with the platform team tomorrow at 2pm',
        sync: true,
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('completed');
    expect(data.laneA.inputTokens).toBeGreaterThan(15000);
    expect(data.laneB.inputTokens).toBeLessThan(1000);
    expect(data.savings.tokenReductionPercent).toBeGreaterThan(90);
    expect(data.savings.savingsPercent).toBeGreaterThan(85);

    // Verify GET /api/runs/:id returns the completed run
    const runRes = await fetch(`${baseUrl}/api/runs/${data.raceId}`);
    expect(runRes.status).toBe(200);
    const runData = (await runRes.json()) as any;
    expect(runData.raceId).toBe(data.raceId);
    expect(runData.isComplete).toBe(true);
  });

  it('GET /api/bench/latest returns latest benchmark evaluation metrics', async () => {
    const res = await fetch(`${baseUrl}/api/bench/latest`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.totalQueries).toBeGreaterThan(0);
    expect(data.accuracy).toBeDefined();
    expect(data.latencyDistributionMs).toBeDefined();
  });
});
