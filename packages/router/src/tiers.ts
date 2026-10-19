import { Tier, Tool, ShortlistResult, DecisionTrace } from './schema.js';
import { CompiledCatalog, formatBedrockConverseTool } from './compileCatalog.js';

export interface ThresholdConfig {
  minScore: number;
  toolCount: number;
}

export const DEFAULT_THRESHOLDS: Record<Tier, ThresholdConfig> = {
  direct: { minScore: 0.85, toolCount: 1 },
  narrow: { minScore: 0.55, toolCount: 3 },
  wide: { minScore: 0.30, toolCount: 6 },
  fallback: { minScore: 0.0, toolCount: 12 },
  no_tool: { minScore: 0.0, toolCount: 0 }
};

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
export function determineTier(topScore: number, needsToolScore: number): Tier {
  // Gate check: If user prompt is general knowledge / chit-chat, return no_tool
  if (needsToolScore < 0.25) {
    return 'no_tool';
  }

  if (topScore >= DEFAULT_THRESHOLDS.direct.minScore) {
    return 'direct';
  }
  if (topScore >= DEFAULT_THRESHOLDS.narrow.minScore) {
    return 'narrow';
  }
  if (topScore >= DEFAULT_THRESHOLDS.wide.minScore) {
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
  latencyMs: number = 40
): ShortlistResult {
  // Sort descending by combined score
  const sorted = [...scoredCandidates].sort((a, b) => b.combinedScore - a.combinedScore);
  const topCandidate = sorted[0];
  const topScore = topCandidate ? topCandidate.combinedScore : 0;
  const topCategory = topCandidate ? topCandidate.category : 'none';
  const categoryConfidence = topCandidate ? topCandidate.categoryScore : 0;

  const tier = determineTier(topScore, needsToolScore);
  const targetCount = DEFAULT_THRESHOLDS[tier].toolCount;

  // Slice tools according to tier allowance
  const chosenCandidates = tier === 'no_tool' ? [] : sorted.slice(0, targetCount);
  const chosenTools: Tool[] = [];

  for (const c of chosenCandidates) {
    const tool = catalog.toolsById.get(c.toolId);
    if (tool) {
      chosenTools.push(tool);
    }
  }

  // Format Bedrock toolConfig
  const bedrockTools = chosenTools.map(formatBedrockConverseTool);

  const decisionTrace: DecisionTrace = {
    needsTool: needsToolScore >= 0.25,
    needsToolScore: Number(needsToolScore.toFixed(3)),
    category: topCategory,
    categoryConfidence: Number(categoryConfidence.toFixed(3)),
    tier,
    shortlistCount: chosenTools.length,
    latencyMs,
    shortlistedTools: chosenCandidates.map((c) => {
      const tool = catalog.toolsById.get(c.toolId);
      return {
        id: c.toolId,
        name: tool ? tool.name : c.toolId,
        score: c.combinedScore
      };
    })
  };

  return {
    tools: chosenTools,
    tier,
    confidence: topScore,
    decisionTrace,
    bedrockToolConfig: {
      tools: bedrockTools
    }
  };
}
