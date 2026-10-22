import { type Tier, type Tool, type ShortlistResult, type DecisionTrace } from './schema.js';
import { type CompiledCatalog, formatBedrockConverseTool } from './compileCatalog.js';
import {
  ThresholdConfig,
  DEFAULT_THRESHOLDS,
  DEFAULT_NO_TOOL_GATE_THRESHOLD,
  ASK_CLARIFICATION_TOOL,
  loadThresholds,
} from './thresholds.js';

export {
  ThresholdConfig,
  DEFAULT_THRESHOLDS,
  DEFAULT_NO_TOOL_GATE_THRESHOLD,
  ASK_CLARIFICATION_TOOL,
  loadThresholds,
};

const defaultRuntimeConfig = loadThresholds();

/**
 * Multiplies category probability by conditional in-category tool probability:
 * P(tool) = P(category) × P(tool | category)
 */
export function combineScores(pCategory: number, pToolGivenCategory: number): number {
  return Number((pCategory * pToolGivenCategory).toFixed(4));
}

/**
 * Determines the shortlist tier based on the top-1 combined tool score
 * and the needs_tool gate confidence.
 */
export function determineTier(
  topScore: number,
  needsToolScore: number,
  thresholds: Record<Tier, ThresholdConfig> = defaultRuntimeConfig.thresholds,
  gateThreshold: number = defaultRuntimeConfig.noToolGateThreshold
): Tier {
  // Gate check: If user prompt is general knowledge / chit-chat, return no_tool
  if (needsToolScore < gateThreshold) {
    return 'no_tool';
  }

  if (topScore >= thresholds.direct.minScore) {
    return 'direct';
  }
  if (topScore >= thresholds.narrow.minScore) {
    return 'narrow';
  }
  if (topScore >= thresholds.wide.minScore) {
    return 'wide';
  }
  return 'fallback';
}

export interface ScoredCandidate {
  toolId: string;
  category: string;
  categoryScore: number;
  inCategoryScore: number;
  combinedScore: number;
}

/**
 * Ranks all evaluated candidates by combined score and allocates tools per tier.
 */
export function rankAndTierShortlist(
  catalog: CompiledCatalog,
  scoredCandidates: ScoredCandidate[],
  needsToolScore: number,
  latencyMs: number = 40,
  customThresholds?: Record<Tier, ThresholdConfig>,
  customGateThreshold?: number
): ShortlistResult {
  const activeThresholds = customThresholds || defaultRuntimeConfig.thresholds;
  const activeGateThreshold = customGateThreshold ?? defaultRuntimeConfig.noToolGateThreshold;

  // Sort descending by combined score
  const sorted = [...scoredCandidates].sort((a, b) => b.combinedScore - a.combinedScore);
  const topCandidate = sorted[0];
  const topScore = topCandidate ? topCandidate.combinedScore : 0;
  const topCategory = topCandidate ? topCandidate.category : 'none';
  const categoryConfidence = topCandidate ? topCandidate.categoryScore : 0;

  const tier = determineTier(topScore, needsToolScore, activeThresholds, activeGateThreshold);
  const targetCount = activeThresholds[tier].toolCount;

  // Slice tools according to tier allowance
  const chosenCandidates = tier === 'no_tool' ? [] : sorted.slice(0, targetCount);
  const chosenTools: Tool[] = [];

  for (const c of chosenCandidates) {
    const tool = catalog.toolsById.get(c.toolId);
    if (tool) {
      chosenTools.push(tool);
    }
  }

  // Fallback tier materialization: append ask_clarification tool if specified and not present
  if (tier === 'fallback' && activeThresholds.fallback.includeAskClarification) {
    if (!chosenTools.some((t) => t.id === ASK_CLARIFICATION_TOOL.id)) {
      chosenTools.push(ASK_CLARIFICATION_TOOL);
    }
  }

  // Format Bedrock toolConfig
  const bedrockTools = chosenTools.map(formatBedrockConverseTool);

  const shortlistedToolsMetadata = chosenCandidates.map((c) => {
    const tool = catalog.toolsById.get(c.toolId);
    return {
      id: c.toolId,
      name: tool ? tool.name : c.toolId,
      score: c.combinedScore,
    };
  });

  if (tier === 'fallback' && activeThresholds.fallback.includeAskClarification) {
    shortlistedToolsMetadata.push({
      id: ASK_CLARIFICATION_TOOL.id,
      name: ASK_CLARIFICATION_TOOL.name,
      score: 0.0,
    });
  }

  const decisionTrace: DecisionTrace = {
    needsTool: needsToolScore >= activeGateThreshold,
    needsToolScore: Number(needsToolScore.toFixed(3)),
    category: topCategory,
    categoryConfidence: Number(categoryConfidence.toFixed(3)),
    tier,
    shortlistCount: chosenTools.length,
    latencyMs,
    shortlistedTools: shortlistedToolsMetadata,
  };

  return {
    tools: chosenTools,
    tier,
    confidence: topScore,
    decisionTrace,
    bedrockToolConfig: {
      tools: bedrockTools,
    },
  };
}
