/**
 * POLARIS Pricing and Token Cost Engine
 *
 * Computes exact dollar costs and enterprise ROI savings across Bedrock models,
 * factoring in prompt tokens, toolConfig schema overhead, and Decider 2B routing costs.
 */

export interface ModelPricing {
  modelId: string;
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
}

export const PRICING_REGISTRY: Record<string, ModelPricing> = {
  'anthropic.claude-3-haiku-20240307-v1:0': {
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
  },
  'anthropic.claude-3-5-sonnet-20240620-v1:0': {
    modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    name: 'Claude 3.5 Sonnet',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'amazon.nova-micro-v1:0': {
    modelId: 'amazon.nova-micro-v1:0',
    name: 'Amazon Nova Micro',
    inputPerMillion: 0.035,
    outputPerMillion: 0.14,
  },
  'strands-decider-2b': {
    modelId: 'strands-decider-2b',
    name: 'Strands Decider 2B (SystemOne)',
    inputPerMillion: 0.05,
    outputPerMillion: 0.05,
  },
};

export interface SavingsComparison {
  costA: number;
  costB: number;
  savingsDollars: number;
  savingsPercent: number;
  tokenReductionPercent: number;
  speedupMultiplier: number;
  costPer10kLaneA: number;
  costPer10kLaneB: number;
  annualizedSavingsDollars: number;
}

/**
 * Calculates raw dollar cost for a given model and token count
 */
export function calculateTokenCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING_REGISTRY[modelId] || PRICING_REGISTRY['anthropic.claude-3-haiku-20240307-v1:0'];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return Number((inputCost + outputCost).toFixed(7));
}

/**
 * Compares Lane A (240 tools baseline) vs Lane B (Polaris Decider shortlist)
 */
export function calculateSavings(
  laneA: { inputTokens: number; outputTokens: number; durationMs: number },
  laneB: { inputTokens: number; outputTokens: number; durationMs: number; deciderTokens?: number },
  modelId: string = 'anthropic.claude-3-haiku-20240307-v1:0',
  requestVolume: number = 10_000
): SavingsComparison {
  // Lane A cost (Bedrock only, loaded with all 240 schemas)
  const singleCostA = calculateTokenCost(modelId, laneA.inputTokens, laneA.outputTokens);

  // Lane B cost (Bedrock on tiny shortlist + Decider 2B SystemOne overhead)
  const singleBedrockCostB = calculateTokenCost(modelId, laneB.inputTokens, laneB.outputTokens);
  const deciderTokens = laneB.deciderTokens || 420; // Avg 2-call hierarchical Decider prompt tokens
  const singleDeciderCost = calculateTokenCost('strands-decider-2b', deciderTokens, 20);
  const singleCostB = singleBedrockCostB + singleDeciderCost;

  const costPer10kLaneA = Number((singleCostA * 10_000).toFixed(2));
  const costPer10kLaneB = Number((singleCostB * 10_000).toFixed(2));

  const totalCostA = Number((singleCostA * requestVolume).toFixed(4));
  const totalCostB = Number((singleCostB * requestVolume).toFixed(4));

  const savingsDollars = Number(Math.max(0, totalCostA - totalCostB).toFixed(4));
  const savingsPercent = totalCostA > 0 ? Number((((totalCostA - totalCostB) / totalCostA) * 100).toFixed(1)) : 0;

  const tokenReductionPercent = laneA.inputTokens > 0
    ? Number((((laneA.inputTokens - laneB.inputTokens) / laneA.inputTokens) * 100).toFixed(1))
    : 0;

  const speedupMultiplier = laneB.durationMs > 0
    ? Number((laneA.durationMs / laneB.durationMs).toFixed(1))
    : 1.0;

  // Assume 10k requests/day for enterprise annualized savings
  const annualizedSavingsDollars = Number((costPer10kLaneA - costPer10kLaneB) * 365);

  return {
    costA: totalCostA,
    costB: totalCostB,
    savingsDollars,
    savingsPercent,
    tokenReductionPercent,
    speedupMultiplier,
    costPer10kLaneA,
    costPer10kLaneB,
    annualizedSavingsDollars,
  };
}
