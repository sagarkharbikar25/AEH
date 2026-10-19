/**
 * POLARIS Race API & Real-Time SSE Routes
 *
 * Endpoints:
 * - POST /api/race             (Launch race, returns raceId & streamUrl, or sync JSON)
 * - GET  /api/race/:id/stream  (Connect to live SSE event stream)
 * - GET  /api/race/:id         (Poll session status)
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import { raceStream } from '../sse/raceStream.js';
import { runLaneA } from '../agent/laneA.js';
import { runLaneB } from '../agent/laneB.js';
import { calculateSavings } from '../agent/pricing.js';
import { spendBudget } from '../middleware/safety.js';

export const raceRouter = Router();

/**
 * Execute race in background and push live telemetry via SSE
 */
async function executeRaceJob(raceId: string, query: string, modelId: string) {
  try {
    raceStream.emitEvent(raceId, 'race:init', {
      raceId,
      query,
      modelId,
      timestamp: new Date().toISOString(),
    });

    // Run both lanes in parallel
    const [laneA, laneB] = await Promise.all([
      runLaneA(query).then((res) => {
        // Emit intermediate stages
        for (const s of res.stages) {
          raceStream.emitEvent(raceId, 'lane:stage', {
            raceId,
            lane: 'laneA',
            stage: s.name,
            durationMs: s.durationMs,
            metadata: s.metadata,
          });
        }
        raceStream.emitEvent(raceId, 'lane:result', res);
        return res;
      }),
      runLaneB(query).then((res) => {
        // Emit intermediate stages
        for (const s of res.stages) {
          raceStream.emitEvent(raceId, 'lane:stage', {
            raceId,
            lane: 'laneB',
            stage: s.name,
            durationMs: s.durationMs,
            metadata: s.metadata,
          });
        }
        raceStream.emitEvent(raceId, 'lane:result', res);
        return res;
      }),
    ]);

    const savings = calculateSavings(
      { inputTokens: laneA.inputTokens, outputTokens: laneA.outputTokens, durationMs: laneA.latencyMs },
      { inputTokens: laneB.inputTokens, outputTokens: laneB.outputTokens, durationMs: laneB.latencyMs },
      modelId
    );

    // Record estimated Bedrock spend to kill-switch tracker
    spendBudget.recordSpend(savings.costA / 10_000);

    raceStream.emitEvent(raceId, 'race:complete', {
      raceId,
      laneA,
      laneB,
      savings,
      parity: laneA.selectedToolId === laneB.selectedToolId,
      timestamp: new Date().toISOString(),
    });

    return { laneA, laneB, savings };
  } catch (err: any) {
    raceStream.emitEvent(raceId, 'race:error', {
      raceId,
      message: err.message || 'An error occurred during dual-lane execution.',
    });
    throw err;
  }
}

/**
 * POST /api/race
 * Starts a new race session
 */
raceRouter.post('/', async (req, res, next) => {
  try {
    const { query, modelId = 'anthropic.claude-3-haiku-20240307-v1:0', sync = false } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Field "query" is required.',
          requestId: req.id,
        },
      });
      return;
    }

    const raceId = `race_${crypto.randomUUID().slice(0, 12)}`;
    raceStream.createSession(raceId, query, modelId);

    if (sync) {
      // Synchronous execution: await completion and return full payload
      const result = await executeRaceJob(raceId, query, modelId);
      res.json({
        raceId,
        status: 'completed',
        ...result,
        requestId: req.id,
      });
      return;
    }

    // Asynchronous execution: kick off job and return SSE stream URL
    executeRaceJob(raceId, query, modelId).catch((err) => {
      console.error(`[RaceJob ${raceId}] Error:`, err);
    });

    res.status(202).json({
      raceId,
      status: 'queued',
      streamUrl: `/api/race/${raceId}/stream`,
      query,
      modelId,
      requestId: req.id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/race/:id/stream
 * Connects to live SSE stream
 */
raceRouter.get('/:id/stream', (req, res) => {
  const raceId = req.params.id;
  const session = raceStream.getSession(raceId);

  if (!session) {
    res.status(404).json({
      error: {
        code: 'RACE_NOT_FOUND',
        message: `Race session "${raceId}" does not exist or has expired.`,
        requestId: req.id,
      },
    });
    return;
  }

  raceStream.registerClient(raceId, res);
});

/**
 * GET /api/race/:id
 * Poll current status of race session
 */
raceRouter.get('/:id', (req, res) => {
  const raceId = req.params.id;
  const session = raceStream.getSession(raceId);

  if (!session) {
    res.status(404).json({
      error: {
        code: 'RACE_NOT_FOUND',
        message: `Race session "${raceId}" not found.`,
        requestId: req.id,
      },
    });
    return;
  }

  res.json({
    raceId: session.raceId,
    query: session.query,
    isComplete: session.isComplete,
    laneA: session.laneA,
    laneB: session.laneB,
    savings: session.savings,
    error: session.error,
    eventCount: session.events.length,
    requestId: req.id,
  });
});
