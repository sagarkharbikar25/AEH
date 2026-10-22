import { type ToolExecutionResult } from '../tools/executor.js';

export interface StageTiming {
  name: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LaneResult {
  lane: 'laneA' | 'laneB';
  query: string;
  selectedToolId: string;
  selectedToolName: string;
  toolInputArgs: Record<string, any>;
  toolExecution: ToolExecutionResult;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  stages: StageTiming[];
  // Lane B specific fields
  tier?: string;
  shortlistCount?: number;
  shortlist?: Array<{ toolId: string; score: number }>;
  deciderLatencyMs?: number;
  bedrockLatencyMs?: number;
}
