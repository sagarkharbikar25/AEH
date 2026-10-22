import { describe, expect, it } from 'vitest';
import {
  BenchResultsSchema,
  ERROR_CODES,
  ERROR_STATUS_BY_CODE,
  ErrorEnvelopeSchema,
  RaceEventSchema,
  RACE_EVENT_TYPES,
  ReplaySchema,
} from './index.js';

const base = { runId: 'run_1', seq: 0, ts: '2026-10-21T00:00:00.000Z' };

describe('error envelope', () => {
  it('accepts every documented code', () => {
    for (const code of ERROR_CODES) {
      const parsed = ErrorEnvelopeSchema.parse({
        error: { code, message: 'x', requestId: 'req_1' },
      });
      expect(parsed.error.code).toBe(code);
    }
  });

  it('rejects an unknown code', () => {
    const result = ErrorEnvelopeSchema.safeParse({
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'x', requestId: 'req_1' },
    });
    expect(result.success).toBe(false);
  });

  it('maps codes to the right status', () => {
    expect(ERROR_STATUS_BY_CODE.BAD_REQUEST).toBe(400);
    expect(ERROR_STATUS_BY_CODE.NOT_FOUND).toBe(404);
    expect(ERROR_STATUS_BY_CODE.RATE_LIMITED).toBe(429);
    expect(ERROR_STATUS_BY_CODE.BUDGET_EXHAUSTED).toBe(429);
    expect(ERROR_STATUS_BY_CODE.DECIDER_UNAVAILABLE).toBe(503);
    expect(ERROR_STATUS_BY_CODE.BEDROCK_THROTTLED).toBe(503);
    expect(ERROR_STATUS_BY_CODE.INTERNAL).toBe(500);
  });
});

describe('race events', () => {
  it('exposes exactly the seven documented event types', () => {
    expect(RACE_EVENT_TYPES).toEqual([
      'decision',
      'shortlist',
      'lane_start',
      'lane_tokens',
      'lane_done',
      'final',
      'error',
    ]);
  });

  it('parses each event type', () => {
    const events = [
      { ...base, type: 'decision', stage: 'category', needsTool: true, confidence: 0.9, latencyMs: 12, topCategories: [{ category: 'calendar', p: 0.9 }] },
      { ...base, type: 'shortlist', tier: 'direct', tools: [{ id: 'calendar.create', name: 'create', score: 0.9 }], totalTools: 240 },
      { ...base, type: 'lane_start', lane: 'polaris', toolsSent: 1, stage: 'reading the sky' },
      { ...base, type: 'lane_tokens', lane: 'polaris', inputTokens: 1200, outputTokens: 80, elapsedMs: 300 },
      { ...base, type: 'lane_done', lane: 'polaris', toolsSent: 1, inputTokens: 1200, outputTokens: 80, latencyMs: 900, chosenTool: 'calendar.create', correct: true, costUsd: 0.01 },
      { ...base, type: 'final', tier: 'direct', decidedTool: 'calendar.create', laneA: { lane: 'baseline', toolsSent: 240, inputTokens: 38420, outputTokens: 90, latencyMs: 3800, chosenTool: 'calendar.create', correct: true, costUsd: 0.12 }, laneB: { lane: 'polaris', toolsSent: 1, inputTokens: 1120, outputTokens: 80, latencyMs: 900, chosenTool: 'calendar.create', correct: true, costUsd: 0.01 }, savings: { inputTokens: 37300, latencyMs: 2900, costUsd: 0.11, tokenSavingsPct: 97 } },
      { ...base, type: 'error', error: { code: 'DECIDER_UNAVAILABLE', message: 'no', requestId: 'req_1' } },
    ];
    for (const event of events) {
      const parsed = RaceEventSchema.parse(event);
      expect(parsed.type).toBe(event.type);
    }
  });

  it('rejects an unknown event type', () => {
    const result = RaceEventSchema.safeParse({ ...base, type: 'race:init' });
    expect(result.success).toBe(false);
  });
});

describe('replay', () => {
  it('is an ordered list of race events', () => {
    const replay = ReplaySchema.parse({
      id: 'easy',
      title: 'Recorded flight',
      query: 'create an event',
      kind: 'easy',
      events: [{ ...base, type: 'lane_start', lane: 'polaris', toolsSent: 1, stage: 'reading the sky' }],
    });
    expect(replay.events).toHaveLength(1);
  });
});

describe('benchmark payload', () => {
  it('requires the simulated flag so the UI can label synthetic numbers', () => {
    const result = BenchResultsSchema.safeParse({
      generatedAt: '2026-10-21T00:00:00.000Z',
      configs: [],
      decider: { samples: 0, recallAt1: 0, recallAt3: 0, recallAt6: 0, p50LatencyMs: 0, p95LatencyMs: 0, tierDistribution: {}, directShare: 0 },
      reliability: [],
      failures: [],
    });
    expect(result.success).toBe(false);
  });
});
