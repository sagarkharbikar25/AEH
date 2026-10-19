/**
 * POLARIS Core API Endpoints
 *
 * Exposes:
 * - GET  /api/health
 * - GET  /api/catalog
 * - POST /api/route
 */

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCatalog, shortlistTools } from '@polaris/router';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../tools/catalog.json');
const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const compiledCatalog = compileCatalog(rawCatalog);

export const apiRouter = Router();

/**
 * Health check & readiness probe
 */
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      router: 'ready',
      catalog: 'ready',
      bedrock: process.env.BEDROCK_MOCK === 'true' ? 'simulated' : 'connected',
    },
    toolsCount: rawCatalog.length,
    requestId: req.id,
  });
});

/**
 * Full 240-tool catalog & constellation metadata
 */
apiRouter.get('/catalog', (req, res) => {
  // Aggregate constellation summary
  const constellationsMap = new Map<string, { id: string; name: string; count: number; tools: any[] }>();

  for (const tool of rawCatalog) {
    if (!constellationsMap.has(tool.category)) {
      constellationsMap.set(tool.category, {
        id: tool.category,
        name: tool.category.charAt(0).toUpperCase() + tool.category.slice(1),
        count: 0,
        tools: [],
      });
    }
    const constell = constellationsMap.get(tool.category)!;
    constell.count++;
    constell.tools.push(tool);
  }

  res.json({
    totalTools: rawCatalog.length,
    constellations: Array.from(constellationsMap.values()),
    tools: rawCatalog,
    requestId: req.id,
  });
});

/**
 * Direct tool routing endpoint via Strands Decider 2B
 */
apiRouter.post('/route', async (req, res, next) => {
  try {
    const { query, options } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Field "query" is required and must be a string.',
          requestId: req.id,
        },
      });
      return;
    }

    const result = await shortlistTools(query, compiledCatalog, options);

    res.json({
      success: true,
      query,
      tier: result.tier,
      confidence: result.confidence,
      candidateCount: result.tools.length,
      tools: result.tools,
      decisionTrace: result.decisionTrace,
      bedrockToolConfig: result.bedrockToolConfig,
      requestId: req.id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Latest benchmark evaluation metrics for the Almanac dashboard
 */
apiRouter.get('/bench/latest', (req, res) => {
  try {
    const resultsPath = path.resolve(__dirname, '../../../bench/results.json');
    if (fs.existsSync(resultsPath)) {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      res.json({
        ...data,
        requestId: req.id,
      });
    } else {
      res.status(404).json({
        error: {
          code: 'BENCHMARK_NOT_FOUND',
          message: 'Benchmark results not yet generated. Run "npm run bench" to generate results.',
          requestId: req.id,
        },
      });
    }
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
        requestId: req.id,
      },
    });
  }
});
