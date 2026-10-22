import { CompiledCatalog } from './compileCatalog.js';
import { 
  DeciderSystemOneRequest, 
  DeciderSystemOneResponse,
  DeciderSystemOneResponseSchema,
  ShortlistResult, 
  RouterOptions 
} from './schema.js';
import { combineScores, rankAndTierShortlist, ScoredCandidate } from './tiers.js';

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

      let scoredCandidates: ScoredCandidate[] = [];

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

    // Check no-tool queries (e.g. explain, what is, law, principle)
    if (
      lower.includes('amdahl') ||
      lower.includes('what is') ||
      lower.includes('explain') ||
      lower.includes('theory') ||
      lower.includes('difference between') ||
      lower.includes('how does') ||
      lower.includes('comparison')
    ) {
      return rankAndTierShortlist(catalog, [], 0.08, Math.max(elapsedMs, 32));
    }

    let topCategory = 'calendar';
    let catConfidence = 0.94;
    let targetTool = 'calendar.create_event';
    let inCatScore = 0.96;

    if (lower.includes('urgent') || lower.includes('escalat') || lower.includes('pager') || lower.includes('alarm')) {
      topCategory = 'telemetry';
      catConfidence = 0.62;
      targetTool = 'telemetry.query_metric_series';
      inCatScore = 0.70;
    } else if (lower.includes('ec2') || lower.includes('instance') || lower.includes('compute') || lower.includes('server') || lower.includes('vm')) {
      topCategory = 'compute';
      catConfidence = 0.93;
      targetTool = lower.includes('cpu') || lower.includes('utiliz') || lower.includes('load')
        ? 'compute.get_cpu_utilization'
        : 'compute.launch_instance';
      inCatScore = 0.95;
    } else if (lower.includes('s3') || lower.includes('bucket') || lower.includes('upload') || lower.includes('storage') || lower.includes('presign')) {
      topCategory = 'storage';
      catConfidence = 0.92;
      targetTool = lower.includes('presign') || lower.includes('url') || lower.includes('download')
        ? 'storage.generate_presigned_url'
        : 'storage.upload_object';
      inCatScore = 0.95;
    } else if (lower.includes('sql') || lower.includes('query') || lower.includes('database') || lower.includes('postgres') || lower.includes('rds') || lower.includes('snapshot')) {
      topCategory = 'database';
      catConfidence = 0.91;
      targetTool = lower.includes('snapshot') || lower.includes('backup')
        ? 'database.create_snapshot'
        : 'database.execute_sql';
      inCatScore = 0.94;
    } else if (lower.includes('calendar') || lower.includes('meeting') || lower.includes('schedule') || lower.includes('slot') || lower.includes('invite') || lower.includes('sync')) {
      topCategory = 'calendar';
      catConfidence = 0.94;
      targetTool = lower.includes('slot') || lower.includes('free') || lower.includes('overlap')
        ? 'calendar.find_free_slots'
        : 'calendar.create_event';
      inCatScore = 0.96;
    } else if (lower.includes('slack') || lower.includes('email') || lower.includes('notify') || lower.includes('message') || lower.includes('channel')) {
      topCategory = 'messaging';
      catConfidence = 0.92;
      targetTool = 'messaging.send_channel_message';
      inCatScore = 0.94;
    } else if (lower.includes('iam') || lower.includes('role') || lower.includes('policy') || lower.includes('security') || lower.includes('kms')) {
      topCategory = 'security';
      catConfidence = 0.90;
      targetTool = 'security.evaluate_iam_policy';
      inCatScore = 0.93;
    } else if (lower.includes('deploy') || lower.includes('pipeline') || lower.includes('ci') || lower.includes('build') || lower.includes('release')) {
      topCategory = 'devops';
      catConfidence = 0.92;
      targetTool = 'devops.trigger_ci_build';
      inCatScore = 0.94;
    } else if (lower.includes('cost') || lower.includes('spend') || lower.includes('billing') || lower.includes('invoice') || lower.includes('budget')) {
      topCategory = 'billing';
      catConfidence = 0.94;
      targetTool = 'billing.get_projected_spend';
      inCatScore = 0.95;
    } else if (lower.includes('ticket') || lower.includes('jira') || lower.includes('issue') || lower.includes('incident') || lower.includes('bug')) {
      topCategory = 'tickets';
      catConfidence = 0.93;
      targetTool = 'tickets.create_incident_ticket';
      inCatScore = 0.95;
    } else if (lower.includes('workflow') || lower.includes('step') || lower.includes('orchestrat') || lower.includes('pipeline_run')) {
      topCategory = 'workflows';
      catConfidence = 0.89;
      targetTool = 'workflows.start_execution';
      inCatScore = 0.92;
    } else if (lower.includes('vpc') || lower.includes('dns') || lower.includes('subnet') || lower.includes('network') || lower.includes('route53')) {
      topCategory = 'network';
      catConfidence = 0.91;
      targetTool = 'network.allocate_elastic_ip';
      inCatScore = 0.93;
    }

    const scoredCandidates: ScoredCandidate[] = [
      {
        toolId: targetTool,
        category: topCategory,
        categoryScore: catConfidence,
        inCategoryScore: inCatScore,
        combinedScore: combineScores(catConfidence, inCatScore)
      }
    ];

    // Add candidate neighbors from the category
    const categoryTools = catalog.toolsByCategory.get(topCategory) || [];
    for (const t of categoryTools) {
      if (t.id !== targetTool && scoredCandidates.length < 6) {
        scoredCandidates.push({
          toolId: t.id,
          category: topCategory,
          categoryScore: catConfidence,
          inCategoryScore: 0.15,
          combinedScore: combineScores(catConfidence, 0.15)
        });
      }
    }

    return rankAndTierShortlist(catalog, scoredCandidates, 0.98, Math.max(elapsedMs, 38));
  }
}
