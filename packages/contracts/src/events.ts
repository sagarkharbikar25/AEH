import { z } from 'zod';
import { ErrorDetailSchema } from './errors.js';
import {
  CategoryScoreSchema,
  LaneSchema,
  ShortlistedToolSchema,
  TierSchema,
} from './catalog.js';

/* =========================================================================
   RACE EVENTS (Server-Sent Events)
   The seven event types are the contract between the Express API and every
   client, live or replaying a recording. A recorded flight is a JSON array
   of these exact objects, so one reducer serves both.
   ========================================================================= */

const RaceEventBaseSchema = z.object({
  runId: z.string().min(1),
  /** Monotonic counter, used by the reducer to drop out-of-order events. */
  seq: z.number().int().nonnegative(),
  /** ISO timestamp of emission. */
  ts: z.string(),
});

/** Decider answered. Emitted the moment the answer exists, not when the lane ends. */
export const DecisionEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('decision'),
  stage: z.enum(['needs_tool', 'category', 'tool']),
  needsTool: z.boolean(),
  confidence: z.number().min(0).max(1),
  latencyMs: z.number().int().nonnegative(),
  topCategories: z.array(CategoryScoreSchema),
});

/** The shortlist Polaris will send to Bedrock. */
export const ShortlistEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('shortlist'),
  tier: TierSchema,
  tools: z.array(ShortlistedToolSchema),
  totalTools: z.number().int().nonnegative(),
});

/** A lane started. `toolsSent` is the whole point of the race. */
export const LaneStartEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('lane_start'),
  lane: LaneSchema,
  toolsSent: z.number().int().nonnegative(),
  stage: z.string(),
});

/** Live token and time counters for a lane. */
export const LaneTokensEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('lane_tokens'),
  lane: LaneSchema,
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
});

/** A lane finished. */
export const LaneDoneEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('lane_done'),
  lane: LaneSchema,
  toolsSent: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  chosenTool: z.string().nullable(),
  correct: z.boolean().nullable(),
  costUsd: z.number(),
});

/** Per-lane summary used by the final event and by the run replay. */
export const LaneSummarySchema = z.object({
  lane: LaneSchema,
  toolsSent: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  chosenTool: z.string().nullable(),
  correct: z.boolean().nullable(),
  costUsd: z.number(),
});
export type LaneSummary = z.infer<typeof LaneSummarySchema>;

/** The race is over. */
export const FinalEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('final'),
  tier: TierSchema,
  decidedTool: z.string().nullable(),
  laneA: LaneSummarySchema,
  laneB: LaneSummarySchema,
  savings: z.object({
    inputTokens: z.number().int(),
    latencyMs: z.number().int(),
    costUsd: z.number(),
    tokenSavingsPct: z.number(),
  }),
});

/** The race failed. Carries the same envelope the REST routes use. */
export const ErrorEventSchema = RaceEventBaseSchema.extend({
  type: z.literal('error'),
  error: ErrorDetailSchema,
});

export const RaceEventSchema = z.discriminatedUnion('type', [
  DecisionEventSchema,
  ShortlistEventSchema,
  LaneStartEventSchema,
  LaneTokensEventSchema,
  LaneDoneEventSchema,
  FinalEventSchema,
  ErrorEventSchema,
]);
export type RaceEvent = z.infer<typeof RaceEventSchema>;

export const RACE_EVENT_TYPES = [
  'decision',
  'shortlist',
  'lane_start',
  'lane_tokens',
  'lane_done',
  'final',
  'error',
] as const;
export type RaceEventType = (typeof RACE_EVENT_TYPES)[number];

/** A recorded flight is just an ordered list of race events. */
export const ReplaySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  query: z.string(),
  kind: z.enum(['easy', 'ambiguous', 'no_tool']),
  events: z.array(RaceEventSchema),
});
export type Replay = z.infer<typeof ReplaySchema>;
