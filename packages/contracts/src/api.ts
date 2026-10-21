import { z } from 'zod';
import { CatalogSchema, TierSchema } from './catalog.js';
import { RaceEventSchema } from './events.js';

/* =========================================================================
   API REQUEST AND RESPONSE BODIES
   ========================================================================= */

export const HealthSchema = z.object({
  api: z.enum(['up', 'degraded', 'down']),
  decider: z.enum(['loading', 'ready', 'down']),
  bedrock: z.enum(['connected', 'simulated', 'down']),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
});
export type Health = z.infer<typeof HealthSchema>;

export const CatalogResponseSchema = z.object({
  tools: CatalogSchema.shape.tools,
  constellations: CatalogSchema.shape.constellations,
});
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

export const RouteRequestSchema = z.object({
  query: z.string().min(1).max(2000),
});
export type RouteRequest = z.infer<typeof RouteRequestSchema>;

/** One answered Decider question. The decision trace is a list of these. */
export const DecisionEntrySchema = z.object({
  stage: z.enum(['needs_tool', 'category', 'tool']),
  questionId: z.string(),
  answer: z.union([z.string(), z.number(), z.boolean()]),
  confidence: z.number(),
  optionsCount: z.number().int().nonnegative().optional(),
  latencyMs: z.number().int().nonnegative(),
});
export type DecisionEntry = z.infer<typeof DecisionEntrySchema>;

export const RouteResponseSchema = z.object({
  needsTool: z.boolean(),
  tier: TierSchema,
  tools: z.array(CatalogSchema.shape.tools.element),
  decisions: z.array(DecisionEntrySchema),
  latencyMs: z.number().int().nonnegative(),
});
export type RouteResponse = z.infer<typeof RouteResponseSchema>;

export const RaceRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  /** Optional: force a specific tier, used by the benchmark. */
  forcedTier: TierSchema.optional(),
});
export type RaceRequest = z.infer<typeof RaceRequestSchema>;

export const RaceAcceptedSchema = z.object({
  runId: z.string().min(1),
  status: z.enum(['queued', 'running', 'done', 'error']),
  streamUrl: z.string().min(1),
});
export type RaceAccepted = z.infer<typeof RaceAcceptedSchema>;

export const RunSchema = z.object({
  runId: z.string().min(1),
  requestId: z.string().min(1),
  query: z.string(),
  createdAt: z.string(),
  events: z.array(RaceEventSchema),
});
export type Run = z.infer<typeof RunSchema>;

/* =========================================================================
   BENCHMARK PAYLOAD
   The Almanac renders exactly this. No metric is hardcoded in the UI.
   ========================================================================= */

export const ReliabilityRowSchema = z.object({
  bucket: z.string(),
  confidenceMin: z.number(),
  confidenceMax: z.number(),
  samples: z.number().int().nonnegative(),
  accuracy: z.number(),
});
export type ReliabilityRow = z.infer<typeof ReliabilityRowSchema>;

export const FailureRowSchema = z.object({
  query: z.string(),
  expected: z.string().nullable(),
  chosen: z.string().nullable(),
  tier: TierSchema,
  confidence: z.number(),
  reason: z.string(),
});
export type FailureRow = z.infer<typeof FailureRowSchema>;

export const BenchResultsSchema = z.object({
  generatedAt: z.string(),
  /** True when the numbers come from a simulator rather than a live model. */
  simulated: z.boolean(),
  configs: z.array(
    z.object({
      id: z.enum(['all_tools', 'flat', 'hierarchical']),
      label: z.string(),
      accuracy: z.number(),
      avgInputTokens: z.number(),
      avgLatencyMs: z.number(),
      costPer1k: z.number(),
    }),
  ),
  decider: z.object({
    samples: z.number().int().nonnegative(),
    recallAt1: z.number(),
    recallAt3: z.number(),
    recallAt6: z.number(),
    p50LatencyMs: z.number(),
    p95LatencyMs: z.number(),
    tierDistribution: z.record(z.string(), z.number().int().nonnegative()),
    directShare: z.number(),
  }),
  reliability: z.array(ReliabilityRowSchema),
  failures: z.array(FailureRowSchema),
});
export type BenchResults = z.infer<typeof BenchResultsSchema>;
