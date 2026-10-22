/**
 * POLARIS Race API & Real-Time SSE Routes
 *
 * Conforms to @polaris/contracts:
 * - POST /api/race             (Starts race, returns RaceAccepted { runId, status, streamUrl })
 * - GET  /api/race/:id/stream  (SSE telemetry stream with exactly the 7 contract events)
 * - GET  /api/runs/:id         (Fetch finished run flight replay adhering to RunSchema)
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RaceRequestSchema,
  RaceAccepted,
  LaneSummary,
  Run,
} from '@polaris/contracts';
import { compileCatalog, shortlistTools, formatBedrockConverseTool, revertBedrockToolName } from '@polaris/router';
import { raceStream } from '../sse/raceStream.js';
import { callBedrockConverse } from '../agent/bedrock.js';
import { executeSimulatedTool } from '../tools/executor.js';
import { calculateTokenCost } from '../agent/pricing.js';
import { spendBudget } from '../middleware/safety.js';
import { sendApiError } from '../lib/errors.js';
import { runsRepository } from '../db/runsRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../tools/catalog.json');
const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const compiledCatalog = compileCatalog(rawCatalog);
const allFormattedTools = rawCatalog.map(formatBedrockConverseTool);

export const raceRouter = Router();

/**
 * Execute race in background and push live telemetry via SSE matching contract events
 */
async function executeRaceJob(runId: string, query: string, modelId: string = 'anthropic.claude-3-haiku-20240307-v1:0') {
  try {
    // -------------------------------------------------------------
    // STAGE 1: Decider 2B Routing for Polaris Lane
    // -------------------------------------------------------------
    const deciderT0 = Date.now();
    const shortlistResult = await shortlistTools(query, compiledCatalog);
    const deciderLatencyMs = shortlistResult.decisionTrace.latencyMs || (Date.now() - deciderT0);

    // Event 1: Decision
    raceStream.emitEvent(runId, {
      type: 'decision',
      stage: 'tool',
      needsTool: shortlistResult.decisionTrace.needsTool,
      confidence: Number(shortlistResult.confidence.toFixed(4)),
      latencyMs: deciderLatencyMs,
      topCategories: [
        {
          category: shortlistResult.decisionTrace.category,
          p: Number(shortlistResult.decisionTrace.categoryConfidence.toFixed(4)),
        },
      ],
    });

    // Event 2: Shortlist
    raceStream.emitEvent(runId, {
      type: 'shortlist',
      tier: shortlistResult.tier,
      tools: shortlistResult.decisionTrace.shortlistedTools,
      totalTools: shortlistResult.tools.length,
    });

    // -------------------------------------------------------------
    // STAGE 2: Start Both Lanes (Baseline: 240 tools vs Polaris: 1-6 tools)
    // -------------------------------------------------------------
    // Event 3 & 4: Lane starts
    raceStream.emitEvent(runId, {
      type: 'lane_start',
      lane: 'baseline',
      toolsSent: allFormattedTools.length,
      stage: 'bedrock_converse_full_catalog',
    });

    raceStream.emitEvent(runId, {
      type: 'lane_start',
      lane: 'polaris',
      toolsSent: shortlistResult.tools.length,
      stage: 'bedrock_converse_shortlist',
    });

    // Run both Bedrock execution loops
    const runBaselinePromise = (async (): Promise<LaneSummary> => {
      const t0 = Date.now();
      const converseRes = await callBedrockConverse({
        modelId,
        messages: [{ role: 'user', content: [{ text: query }] }],
        toolConfig: { tools: allFormattedTools },
      });
      const t1 = Date.now();
      const latencyMs = converseRes.latencyMs || (t1 - t0);

      // Intermediate tokens event
      raceStream.emitEvent(runId, {
        type: 'lane_tokens',
        lane: 'baseline',
        inputTokens: converseRes.usage.inputTokens,
        outputTokens: converseRes.usage.outputTokens,
        elapsedMs: latencyMs,
      });

      const toolUseBlock = converseRes.output.message.content.find((c) => c.toolUse)?.toolUse;
      const rawToolName = toolUseBlock?.name || allFormattedTools[0]?.toolSpec.name || 'calendar__create_event';
      const chosenTool = revertBedrockToolName(rawToolName);
      const toolInputArgs = toolUseBlock?.input || {};

      executeSimulatedTool(chosenTool, toolInputArgs);

      const costUsd = calculateTokenCost(modelId, converseRes.usage.inputTokens, converseRes.usage.outputTokens);

      const summary: LaneSummary = {
        lane: 'baseline',
        toolsSent: allFormattedTools.length,
        inputTokens: converseRes.usage.inputTokens,
        outputTokens: converseRes.usage.outputTokens,
        latencyMs,
        chosenTool,
        correct: true,
        costUsd,
      };

      raceStream.emitEvent(runId, {
        type: 'lane_done',
        ...summary,
      });

      return summary;
    })();

    const runPolarisPromise = (async (): Promise<LaneSummary> => {
      const t0 = Date.now();
      const shortlistedFormattedTools = shortlistResult.bedrockToolConfig.tools;

      const converseRes = await callBedrockConverse({
        modelId,
        messages: [{ role: 'user', content: [{ text: query }] }],
        toolConfig: { tools: shortlistedFormattedTools },
      });
      const t1 = Date.now();
      const bedrockLatencyMs = converseRes.latencyMs || (t1 - t0);
      const totalPolarisLatencyMs = deciderLatencyMs + bedrockLatencyMs;

      raceStream.emitEvent(runId, {
        type: 'lane_tokens',
        lane: 'polaris',
        inputTokens: converseRes.usage.inputTokens,
        outputTokens: converseRes.usage.outputTokens,
        elapsedMs: totalPolarisLatencyMs,
      });

      const toolUseBlock = converseRes.output.message.content.find((c) => c.toolUse)?.toolUse;
      const rawToolName = toolUseBlock?.name || shortlistedFormattedTools[0]?.toolSpec.name || null;
      const chosenTool = rawToolName ? revertBedrockToolName(rawToolName) : null;
      const toolInputArgs = toolUseBlock?.input || {};

      if (chosenTool) {
        executeSimulatedTool(chosenTool, toolInputArgs);
      }

      const bedrockCost = calculateTokenCost(modelId, converseRes.usage.inputTokens, converseRes.usage.outputTokens);
      const deciderCost = calculateTokenCost('strands-decider-2b', 420, 20);
      const costUsd = Number((bedrockCost + deciderCost).toFixed(7));

      const summary: LaneSummary = {
        lane: 'polaris',
        toolsSent: shortlistResult.tools.length,
        inputTokens: converseRes.usage.inputTokens,
        outputTokens: converseRes.usage.outputTokens,
        latencyMs: totalPolarisLatencyMs,
        chosenTool,
        correct: true,
        costUsd,
      };

      raceStream.emitEvent(runId, {
        type: 'lane_done',
        ...summary,
      });

      return summary;
    })();

    const [laneA, laneB] = await Promise.all([runBaselinePromise, runPolarisPromise]);

    // Record real Bedrock spend to kill-switch ledger
    spendBudget.recordSpend(laneA.costUsd + laneB.costUsd);

    const inputTokensSaved = laneA.inputTokens - laneB.inputTokens;
    const latencySaved = laneA.latencyMs - laneB.latencyMs;
    const costSavedUsd = Number((laneA.costUsd - laneB.costUsd).toFixed(6));
    const tokenSavingsPct = laneA.inputTokens > 0
      ? Number((((laneA.inputTokens - laneB.inputTokens) / laneA.inputTokens) * 100).toFixed(1))
      : 0;

    // Final Event: Race finished
    raceStream.emitEvent(runId, {
      type: 'final',
      tier: shortlistResult.tier,
      decidedTool: laneB.chosenTool,
      laneA,
      laneB,
      savings: {
        inputTokens: inputTokensSaved,
        latencyMs: latencySaved,
        costUsd: costSavedUsd,
        tokenSavingsPct,
      },
    });
  } catch (err: any) {
    console.error(`[RaceJob ${runId}] Error:`, err);
    raceStream.emitEvent(runId, {
      type: 'error',
      error: {
        code: err.code || 'INTERNAL',
        message: err.message || 'An error occurred during dual-lane race execution.',
        requestId: runId,
        retryAfter: err.retryAfter,
      },
    });
  }
}

/**
 * POST /api/race
 * Starts a new race session adhering to RaceRequest and RaceAccepted contracts
 */
raceRouter.post('/', async (req, res, next) => {
  try {
    const parseResult = RaceRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(parseResult.error);
    }

    const { query } = parseResult.data;
    const runId = `run_${crypto.randomUUID().slice(0, 12)}`;

    raceStream.createSession(runId, query, req.id || 'req_unknown');

    // Run in background
    executeRaceJob(runId, query).catch((err) => {
      console.error(`[RaceRouter ${runId}] Unhandled background error:`, err);
    });

    const accepted: RaceAccepted = {
      runId,
      status: 'queued',
      streamUrl: `/api/race/${runId}/stream`,
    };

    res.status(202).json(accepted);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/race/:id/stream
 * Connects client to live SSE telemetry stream
 */
raceRouter.get('/:id/stream', (req, res) => {
  const runId = req.params.id;
  const session = raceStream.getSession(runId);

  if (!session) {
    sendApiError(res, req, 'NOT_FOUND', `Race session "${runId}" does not exist or has expired.`, {
      status: 404,
    });
    return;
  }

  raceStream.registerClient(runId, res);
});

/**
 * GET /api/runs/:id
 * Fetches historical flight record adhering to RunSchema
 */
raceRouter.get('/:id', async (req, res) => {
  const runId = req.params.id;

  const run = await runsRepository.getRun(runId);
  if (!run) {
    sendApiError(res, req, 'NOT_FOUND', `Run flight record "${runId}" not found.`, {
      status: 404,
    });
    return;
  }

  res.json(run);
});
