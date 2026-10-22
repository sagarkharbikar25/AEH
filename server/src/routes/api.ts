/**
 * POLARIS Core API Endpoints
 *
 * Implements strict conformance to @polaris/contracts:
 * - GET  /api/health       -> HealthSchema ({ api, decider, bedrock, version, uptimeSeconds })
 * - GET  /api/catalog      -> CatalogResponseSchema ({ tools, constellations })
 * - POST /api/route        -> RouteResponseSchema ({ needsTool, tier, tools, decisions, latencyMs })
 * - GET  /api/bench/latest -> BenchResultsSchema
 */

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Health,
  HealthSchema,
  CatalogResponse,
  CatalogResponseSchema,
  RouteRequestSchema,
  RouteResponse,
  RouteResponseSchema,
  Constellation,
} from '@polaris/contracts';
import { compileCatalog, shortlistTools } from '@polaris/router';
import { sendApiError } from '../lib/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../tools/catalog.json');
const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const compiledCatalog = compileCatalog(rawCatalog);

export const apiRouter = Router();

/**
 * Probes Strands Decider 2B service endpoint status
 */
async function probeDecider(deciderUrl: string = process.env.DECIDER_URL || 'http://localhost:8000'): Promise<'loading' | 'ready' | 'down'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);
  try {
    const res = await fetch(`${deciderUrl}/health`, { signal: controller.signal });
    if (res.ok) return 'ready';
    return 'loading';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probes Amazon Bedrock service configuration status
 */
function probeBedrock(): 'connected' | 'simulated' | 'down' {
  if (process.env.BEDROCK_MOCK === 'true') {
    return 'simulated';
  }
  const hasAwsCreds = Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    process.env.AWS_PROFILE ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    process.env.AWS_ROLE_ARN
  );
  return hasAwsCreds ? 'connected' : 'simulated';
}

/**
 * GET /api/health
 * Probe API, Decider 2B local router, and Amazon Bedrock connectivity
 */
apiRouter.get('/health', async (req, res) => {
  const deciderStatus = await probeDecider();
  const bedrockStatus = probeBedrock();

  const healthPayload: Health = {
    api: deciderStatus === 'down' ? 'degraded' : 'up',
    decider: deciderStatus,
    bedrock: bedrockStatus,
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
  };

  HealthSchema.parse(healthPayload);
  res.json(healthPayload);
});

/**
 * GET /api/catalog
 * Full 240-tool celestial catalog & constellation metadata
 */
apiRouter.get('/catalog', (req, res) => {
  const constellationsMap = new Map<string, Constellation>();

  for (const tool of rawCatalog) {
    if (!constellationsMap.has(tool.category)) {
      constellationsMap.set(tool.category, {
        id: tool.category,
        name: tool.category.charAt(0).toUpperCase() + tool.category.slice(1),
        descriptor: compiledCatalog.categoryOptions[tool.category] || `${tool.category} tools`,
        toolsCount: 0,
      });
    }
    const constell = constellationsMap.get(tool.category)!;
    constell.toolsCount = (constell.toolsCount || 0) + 1;
  }

  const catalogResponse: CatalogResponse = {
    tools: rawCatalog,
    constellations: Array.from(constellationsMap.values()),
  };

  CatalogResponseSchema.parse(catalogResponse);
  res.json(catalogResponse);
});

/**
 * POST /api/route
 * Direct tool routing endpoint via Strands Decider 2B
 */
apiRouter.post('/route', async (req, res, next) => {
  try {
    const parseResult = RouteRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(parseResult.error);
    }

    const { query } = parseResult.data;
    const result = await shortlistTools(query, compiledCatalog);

    const decisions = [
      {
        stage: 'needs_tool' as const,
        questionId: 'needs_tool',
        answer: result.decisionTrace.needsTool,
        confidence: result.decisionTrace.needsToolScore,
        latencyMs: Math.round(result.decisionTrace.latencyMs / 2),
      },
      {
        stage: 'category' as const,
        questionId: 'category',
        answer: result.decisionTrace.category,
        confidence: result.decisionTrace.categoryConfidence,
        optionsCount: Object.keys(compiledCatalog.categoryOptions).length,
        latencyMs: Math.round(result.decisionTrace.latencyMs / 2),
      },
      {
        stage: 'tool' as const,
        questionId: 'in_category_tool',
        answer: result.tools[0]?.name || 'none',
        confidence: result.confidence,
        optionsCount: result.tools.length,
        latencyMs: result.decisionTrace.latencyMs,
      },
    ];

    const responsePayload: RouteResponse = {
      needsTool: result.decisionTrace.needsTool,
      tier: result.tier,
      tools: result.tools,
      decisions,
      latencyMs: result.decisionTrace.latencyMs,
    };

    RouteResponseSchema.parse(responsePayload);
    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bench/latest
 * Latest benchmark evaluation metrics for the Almanac dashboard
 */
apiRouter.get('/bench/latest', (req, res) => {
  try {
    const resultsPath = path.resolve(__dirname, '../../../bench/results.json');
    if (fs.existsSync(resultsPath)) {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      res.json(data);
    } else {
      sendApiError(
        res,
        req,
        'NOT_FOUND',
        'Benchmark results not yet generated. Run "npm run bench" to generate results.',
        { status: 404 }
      );
    }
  } catch (err: any) {
    sendApiError(res, req, 'INTERNAL', err.message, { status: 500 });
  }
});
