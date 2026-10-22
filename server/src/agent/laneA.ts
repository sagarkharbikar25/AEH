/**
 * Lane A: Baseline Agent Execution Loop (All 240 Tools)
 *
 * Sends all 240 enterprise tools directly into Amazon Bedrock Converse toolConfig,
 * incurring massive KV cache prefill overhead (~20,400 tokens) and elevated TTFT (~1,200ms).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatBedrockConverseTool, revertBedrockToolName } from '@polaris/router';
import { callBedrockConverse } from './bedrock.js';
import { executeSimulatedTool } from '../tools/executor.js';
import { type LaneResult, type StageTiming } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../tools/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

export async function runLaneA(query: string): Promise<LaneResult> {
  const _startTime = Date.now();
  const stages: StageTiming[] = [];

  // Stage 1: Schema compilation of all 240 tools
  const t0 = Date.now();
  const compiledTools = catalog.map((t: any) => formatBedrockConverseTool(t));
  const t1 = Date.now();
  stages.push({
    name: 'schema_compilation',
    durationMs: t1 - t0,
    timestamp: new Date(t0).toISOString(),
    metadata: { toolCount: compiledTools.length },
  });

  // Stage 2: Call Bedrock Converse with all 240 tools
  const t2 = Date.now();
  const converseRes = await callBedrockConverse({
    messages: [
      {
        role: 'user',
        content: [{ text: query }],
      },
    ],
    toolConfig: {
      tools: compiledTools,
    },
  });
  const t3 = Date.now();
  stages.push({
    name: 'bedrock_converse',
    durationMs: converseRes.latencyMs || t3 - t2,
    timestamp: new Date(t2).toISOString(),
    metadata: {
      inputTokens: converseRes.usage.inputTokens,
      outputTokens: converseRes.usage.outputTokens,
      isMock: converseRes.isMock,
    },
  });

  // Extract selected tool
  const toolUseBlock = converseRes.output.message.content.find((c) => c.toolUse)?.toolUse;
  const rawToolName = toolUseBlock?.name || 'calendar__create_event';
  const selectedToolId = revertBedrockToolName(rawToolName);
  const toolInputArgs = toolUseBlock?.input || {};

  // Stage 3: Simulated Tool Execution
  const t4 = Date.now();
  const toolExecution = executeSimulatedTool(selectedToolId, toolInputArgs);
  const t5 = Date.now();
  stages.push({
    name: 'tool_execution',
    durationMs: toolExecution.latencyMs || t5 - t4,
    timestamp: new Date(t4).toISOString(),
    metadata: { status: toolExecution.status },
  });

  const totalLatencyMs = stages.reduce((acc, s) => acc + s.durationMs, 0);

  return {
    lane: 'laneA',
    query,
    selectedToolId,
    selectedToolName: selectedToolId.split('.')[1] || selectedToolId,
    toolInputArgs,
    toolExecution,
    inputTokens: converseRes.usage.inputTokens,
    outputTokens: converseRes.usage.outputTokens,
    totalTokens: converseRes.usage.totalTokens,
    latencyMs: totalLatencyMs,
    stages,
  };
}
