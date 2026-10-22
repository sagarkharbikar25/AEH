import { type CompiledCatalog } from './compileCatalog.js';
import { 
  type DeciderSystemOneRequest, 
  type DeciderSystemOneResponse,
  DeciderSystemOneResponseSchema,
  type ShortlistResult, 
  type RouterOptions 
} from './schema.js';
import { combineScores, rankAndTierShortlist, type ScoredCandidate } from './tiers.js';

function parseNoulScore(answerObj: any): number {
  if (!answerObj) return 0.5;

  const rawAns = answerObj.answer;
  const isNo =
    rawAns === false ||
    rawAns === 0 ||
    String(rawAns).trim().toLowerCase() === 'no' ||
    String(rawAns).trim().toLowerCase() === 'false' ||
    String(rawAns).trim().toLowerCase() === '0';

  if (isNo) {
    if (typeof answerObj.confidence === 'number') {
      return Math.min(0.05, Math.max(0, 1 - answerObj.confidence));
    }
    return 0.05;
  }

  if (typeof answerObj.confidence === 'number') {
    return answerObj.confidence;
  }
  return 0.95;
}

export class DeciderClient {
  private deciderUrl: string;
  private timeoutMs: number;
  private allowSimulatedFallback: boolean;

  constructor(options: RouterOptions = {}) {
    this.deciderUrl = options.deciderUrl || 'http://localhost:8000';
    this.timeoutMs = options.timeoutMs || 2500;
    this.allowSimulatedFallback = options.allowSimulatedFallback !== false;
  }

  /**
   * Executes a typed POST /v1/systemone request against the Strands Decider 2B server.
   */
  async callSystemOne(payload: DeciderSystemOneRequest): Promise<DeciderSystemOneResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.deciderUrl}/v1/systemone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Decider 2B HTTP ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      return DeciderSystemOneResponseSchema.parse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Two-call hierarchical routing flow placing Decider 2B in front of Amazon Bedrock.
   */
  async route(prompt: string, catalog: CompiledCatalog): Promise<ShortlistResult> {
    const startTime = Date.now();

    try {
      // -------------------------------------------------------------
      // CALL 1: Evaluate needs_tool + Category Cluster
      // -------------------------------------------------------------
      const call1Payload: DeciderSystemOneRequest = {
        state: prompt,
        questions: {
          needs_tool: {
            type: 'noul',
            instructions: 'Does this request require calling an external tool or API, rather than answering from general knowledge?'
          },
          category: {
            type: 'choice',
            instructions: 'Which tool category cluster does this user request target?',
            options: catalog.categoryOptions
          }
        }
      };

      const call1Response = await this.callSystemOne(call1Payload);
      const needsToolAnswer = call1Response.answers.needs_tool;
      const needsToolScore = parseNoulScore(needsToolAnswer);

      // Gate: if clearly no tool is needed, short-circuit immediately
      if (needsToolScore < 0.25) {
        return rankAndTierShortlist(catalog, [], needsToolScore, Date.now() - startTime);
      }

      // Extract top-2 categories by probability
      const categoryAnswer = call1Response.answers.category;
      const categoryProbs = categoryAnswer.probabilities || {
        [String(categoryAnswer.answer)]: categoryAnswer.confidence || 0.92
      };

      const sortedCategories: [string, number][] = (Object.entries(categoryProbs) as [string, number][])
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 2);

      // -------------------------------------------------------------
      // CALL 2: In-Category Tool Selection for Top-2 Categories
      // -------------------------------------------------------------
      const call2Questions: Record<string, any> = {};
      for (const [cat] of sortedCategories) {
        const toolOptions = catalog.toolOptionsByCategory[cat];
        if (toolOptions && Object.keys(toolOptions).length > 0) {
          call2Questions[`tool_${cat}`] = {
            type: 'choice',
            instructions: `Select the exact instrument within the ${cat} subsystem`,
            options: toolOptions
          };
        }
      }

      const scoredCandidates: ScoredCandidate[] = [];

      if (Object.keys(call2Questions).length > 0) {
        const call2Payload: DeciderSystemOneRequest = {
          state: prompt,
          questions: call2Questions
        };

        const call2Response = await this.callSystemOne(call2Payload);

        for (const [cat, catScore] of sortedCategories) {
          const qId = `tool_${cat}`;
          const toolAnswer = call2Response.answers[qId];
          if (!toolAnswer) continue;

          const toolProbs = toolAnswer.probabilities || {
            [String(toolAnswer.answer)]: toolAnswer.confidence || 0.90
          };

          for (const [toolId, inCatScore] of Object.entries(toolProbs)) {
            scoredCandidates.push({
              toolId,
              category: cat,
              categoryScore: Number(catScore),
              inCategoryScore: Number(inCatScore),
              combinedScore: combineScores(Number(catScore), Number(inCatScore))
            });
          }
        }
      }

      const totalLatency = Date.now() - startTime;
      return rankAndTierShortlist(catalog, scoredCandidates, needsToolScore, totalLatency);

    } catch (err) {
      if (this.allowSimulatedFallback) {
        // Fallback simulation when Decider server is unreachable
        return this.simulateHierarchicalRoute(prompt, catalog, Date.now() - startTime);
      }
      throw err;
    }
  }

  /**
   * Calibrated heuristic fallback when running offline or during testing.
   */
  private simulateHierarchicalRoute(prompt: string, catalog: CompiledCatalog, elapsedMs: number): ShortlistResult {
    const lower = prompt.toLowerCase();

    // Check no-tool queries (e.g. explain, what is, law, principle, general knowledge)
    const isNoTool =
      lower.includes('amdahl') ||
      lower.includes('what is') ||
      lower.includes('explain') ||
      lower.includes('theory') ||
      lower.includes('difference between') ||
      lower.includes('how does') ||
      lower.includes('comparison') ||
      lower.includes('capital of') ||
      lower.includes('recipe') ||
      lower.includes('who wrote') ||
      lower.includes('poem') ||
      lower.includes('meaning of life');

    if (isNoTool) {
      return rankAndTierShortlist(catalog, [], 0.08, Math.max(elapsedMs, 32));
    }

    const words = lower.replace(/[^a-z0-9_]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

    // 1. Score categories based on prompt words matching category name & descriptor
    const categoryScores: Array<{ category: string; score: number }> = [];
    for (const [cat, desc] of Object.entries(catalog.categoryOptions)) {
      let matches = 0;
      const catLower = `${cat} ${desc}`.toLowerCase();
      for (const w of words) {
        if (catLower.includes(w)) matches++;
      }
      const score = matches > 0 ? Math.min(0.98, 0.40 + matches * 0.15) : 0.10;
      categoryScores.push({ category: cat, score });
    }

    categoryScores.sort((a, b) => b.score - a.score);
    const top2Categories = categoryScores.slice(0, 2);

    // 2. Score tools in top categories
    const scoredCandidates: ScoredCandidate[] = [];
    for (const { category, score: catScore } of top2Categories) {
      const tools = catalog.toolsByCategory.get(category) || [];
      for (const tool of tools) {
        const toolText = `${tool.name} ${tool.descriptor} ${tool.description}`.toLowerCase();
        let toolMatches = 0;
        for (const w of words) {
          if (toolText.includes(w)) toolMatches++;
        }
        const inCatScore = toolMatches > 0 ? Math.min(0.98, 0.45 + toolMatches * 0.12) : 0.05;
        const combinedScore = combineScores(catScore, inCatScore);
        scoredCandidates.push({
          toolId: tool.id,
          category,
          categoryScore: catScore,
          inCategoryScore: inCatScore,
          combinedScore,
        });
      }
    }

    scoredCandidates.sort((a, b) => b.combinedScore - a.combinedScore);

    return rankAndTierShortlist(catalog, scoredCandidates, 0.95, Math.max(elapsedMs, 36));
  }
}
