import { z } from 'zod';

/* =========================================================================
   1. STRANDS DECIDER 2B SYSTEMONE API SCHEMAS
   Endpoint: POST /v1/systemone
   ========================================================================= */

export const DeciderNoulQuestionSchema = z.object({
  type: z.literal('noul'),
  instructions: z.string().describe('Clear yes/no question evaluated over state text')
});

export const DeciderChoiceOptionSchema = z.object({
  id: z.string(),
  descriptor: z.string().max(100).describe('Concise description, <= 12 words')
});

export const DeciderChoiceQuestionSchema = z.object({
  type: z.literal('choice'),
  instructions: z.string(),
  options: z.record(z.string(), z.string()).or(z.array(DeciderChoiceOptionSchema)).describe('Map of optionId to descriptor or list of options')
});

export const DeciderScoreQuestionSchema = z.object({
  type: z.literal('score'),
  instructions: z.string()
});

export const DeciderQuestionSchema = z.union([
  DeciderNoulQuestionSchema,
  DeciderChoiceQuestionSchema,
  DeciderScoreQuestionSchema
]);

export const DeciderSystemOneRequestSchema = z.object({
  state: z.string().describe('User request context or conversational turns'),
  questions: z.record(z.string(), DeciderQuestionSchema).describe('Dictionary of question IDs to question configs')
});

export const DeciderAnswerSchema = z.object({
  answer: z.union([z.string(), z.number(), z.boolean()]),
  confidence: z.number().min(0).max(1).optional(),
  probabilities: z.record(z.string(), z.number()).optional()
});

export const DeciderSystemOneResponseSchema = z.object({
  answers: z.record(z.string(), DeciderAnswerSchema),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional()
  }).optional(),
  latency_ms: z.number().optional()
});

export type DeciderQuestion = z.infer<typeof DeciderQuestionSchema>;
export type DeciderSystemOneRequest = z.infer<typeof DeciderSystemOneRequestSchema>;
export type DeciderAnswer = z.infer<typeof DeciderAnswerSchema>;
export type DeciderSystemOneResponse = z.infer<typeof DeciderSystemOneResponseSchema>;


/* =========================================================================
   2. POLARIS TOOL CATALOG & CONSTELLATION SCHEMAS
   ========================================================================= */

export const ToolParameterSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional()
});

export const ToolSchema = z.object({
  id: z.string().describe('Unique tool ID, e.g. calendar.create_event'),
  name: z.string().describe('Human-readable or function name'),
  category: z.string().describe('Constellation subsystem ID'),
  descriptor: z.string().max(120).describe('Calibrated <= 12 word summary for Decider choice'),
  description: z.string().describe('Full documentation of tool capability'),
  parameters: z.record(z.string(), z.any()).optional().describe('JSON Schema for tool parameters'),
  x: z.number().optional(),
  y: z.number().optional()
});

export const ConstellationSchema = z.object({
  id: z.string(),
  name: z.string(),
  descriptor: z.string(),
  toolsCount: z.number().optional(),
  hubCoordinates: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
});

export type Tool = z.infer<typeof ToolSchema>;
export type Constellation = z.infer<typeof ConstellationSchema>;


/* =========================================================================
   3. POLARIS SHORTLIST & DECISION TRACE SCHEMAS
   ========================================================================= */

export const TierSchema = z.enum(['direct', 'narrow', 'wide', 'fallback', 'no_tool']);
export type Tier = z.infer<typeof TierSchema>;

export const DecisionTraceSchema = z.object({
  needsTool: z.boolean(),
  needsToolScore: z.number(),
  category: z.string(),
  categoryConfidence: z.number(),
  tier: TierSchema,
  shortlistCount: z.number(),
  latencyMs: numberOrFallback(40),
  shortlistedTools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    score: z.number()
  }))
});

function numberOrFallback(fallback: number) {
  return z.number().optional().default(fallback);
}

export const ShortlistResultSchema = z.object({
  tools: z.array(ToolSchema),
  tier: TierSchema,
  confidence: z.number(),
  decisionTrace: DecisionTraceSchema,
  bedrockToolConfig: z.object({
    tools: z.array(z.any())
  })
});

export type DecisionTrace = z.infer<typeof DecisionTraceSchema>;
export type ShortlistResult = z.infer<typeof ShortlistResultSchema>;


/* =========================================================================
   4. ROUTER CONFIGURATION OPTIONS
   ========================================================================= */

export interface RouterOptions {
  deciderUrl?: string;
  timeoutMs?: number;
  maxShortlist?: number;
  allowSimulatedFallback?: boolean;
}
