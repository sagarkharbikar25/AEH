export interface Tool {
  id: string;
  category: string;
  name: string;
  descriptor: string;
  description: string;
  x: number; // 0 to 1000
  y: number; // 0 to 700
}

export type RoutingTier = 'direct' | 'narrow' | 'wide' | 'fallback' | 'no_tool';

export interface DecisionLog {
  needsToolScore: number;
  category: string;
  categoryConfidence: number;
  topCategories: { category: string; prob: number }[];
  tier: RoutingTier;
  shortlistCount: number;
  shortlistedTools: { id: string; name: string; score: number }[];
  latencyMs: number;
}

export interface LaneMetrics {
  stage: 'idle' | 'reading_sky' | 'plotting_course' | 'calling_tool' | 'done';
  toolsSent: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  chosenTool: string | null;
  resultSummary: string | null;
}

export interface RaceState {
  status: 'idle' | 'deciding' | 'racing' | 'done' | 'error';
  query: string;
  source: 'live' | 'replay';
  replayId?: string;
  decision?: DecisionLog;
  laneA: LaneMetrics;
  laneB: LaneMetrics;
  selectedStarId?: string | null;
  error?: {
    code: string;
    message: string;
    requestId: string;
    retryAfter?: number;
  };
}

export type ErrorVariant = 
  | 'not_found' 
  | 'server_error' 
  | 'rate_limited' 
  | 'budget_exhausted' 
  | 'offline_backend' 
  | 'signal_lost' 
  | 'no_network' 
  | 'throttled';
