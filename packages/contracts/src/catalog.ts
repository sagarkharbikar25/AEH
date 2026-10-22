import { z } from 'zod';

/* =========================================================================
   CATALOG
   The wire shape of a tool as it travels from the database to the browser.
   `x` and `y` are precomputed star-chart coordinates; they are never
   recalculated at runtime.
   ========================================================================= */

export const ToolParameterSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});
export type ToolParameter = z.infer<typeof ToolParameterSchema>;

export const ToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  /** At most 12 words. This is the only text Decider sees as a choice option. */
  descriptor: z.string().min(1).max(120),
  description: z.string(),
  /** JSON Schema for the tool parameters. */
  parameters: z.record(z.string(), z.any()).optional(),
  /** Precomputed star-chart position. */
  x: z.number().optional(),
  y: z.number().optional(),
});
export type Tool = z.infer<typeof ToolSchema>;

export const ConstellationSchema = z.object({
  id: z.string(),
  name: z.string(),
  descriptor: z.string(),
  toolsCount: z.number().int().nonnegative().optional(),
  /** Centre of the constellation on the star chart. */
  hubCoordinates: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});
export type Constellation = z.infer<typeof ConstellationSchema>;

export const CatalogSchema = z.object({
  tools: z.array(ToolSchema),
  constellations: z.array(ConstellationSchema),
});
export type Catalog = z.infer<typeof CatalogSchema>;

/* =========================================================================
   SHORTLIST AND TIERS
   ========================================================================= */

export const TIER_NAMES = ['direct', 'narrow', 'wide', 'fallback', 'no_tool'] as const;
export const TierSchema = z.enum(TIER_NAMES);
export type Tier = z.infer<typeof TierSchema>;

export const LANE_NAMES = ['baseline', 'polaris'] as const;
export const LaneSchema = z.enum(LANE_NAMES);
export type Lane = z.infer<typeof LaneSchema>;

export const ShortlistedToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
});
export type ShortlistedTool = z.infer<typeof ShortlistedToolSchema>;

export const CategoryScoreSchema = z.object({
  category: z.string(),
  p: z.number().min(0).max(1),
});
export type CategoryScore = z.infer<typeof CategoryScoreSchema>;

export const DecisionTraceSchema = z.object({
  needsTool: z.boolean(),
  needsToolScore: z.number(),
  category: z.string(),
  categoryConfidence: z.number(),
  tier: TierSchema,
  shortlistCount: z.number().int().nonnegative(),
  latencyMs: z.number(),
  shortlistedTools: z.array(ShortlistedToolSchema),
});
export type DecisionTrace = z.infer<typeof DecisionTraceSchema>;

export const ShortlistResultSchema = z.object({
  tools: z.array(ToolSchema),
  tier: TierSchema,
  confidence: z.number(),
  decisionTrace: DecisionTraceSchema,
});
export type ShortlistResult = z.infer<typeof ShortlistResultSchema>;
