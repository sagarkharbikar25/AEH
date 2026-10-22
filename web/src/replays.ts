import { type RaceState } from './types';

export interface ReplayItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  state: RaceState;
}

export const REPLAYS: Record<string, ReplayItem> = {
  easy: {
    id: 'easy',
    title: 'Flight I · High Confidence (Direct Tier)',
    description: 'Direct request with unambiguous intent. Decider routes with 0.96 confidence directly to 1 tool.',
    badge: 'Direct (1 Tool)',
    state: {
      status: 'done',
      query: 'Schedule team sync on calendar tomorrow at 4 PM for 45 minutes',
      source: 'replay',
      replayId: 'easy',
      selectedStarId: 'calendar.create_event',
      decision: {
        needsToolScore: 0.98,
        category: 'calendar',
        categoryConfidence: 0.96,
        topCategories: [
          { category: 'calendar', prob: 0.96 },
          { category: 'messaging', prob: 0.03 },
          { category: 'workflows', prob: 0.01 }
        ],
        tier: 'direct',
        shortlistCount: 1,
        shortlistedTools: [
          { id: 'calendar.create_event', name: 'create_event', score: 0.94 }
        ],
        latencyMs: 38
      },
      laneA: {
        stage: 'done',
        toolsSent: 240,
        inputTokens: 38420,
        outputTokens: 88,
        latencyMs: 3750,
        chosenTool: 'calendar.create_event',
        resultSummary: 'Meeting "Team Sync" created successfully for tomorrow 16:00-16:45.'
      },
      laneB: {
        stage: 'done',
        toolsSent: 1,
        inputTokens: 1120,
        outputTokens: 88,
        latencyMs: 410,
        chosenTool: 'calendar.create_event',
        resultSummary: 'Meeting "Team Sync" created successfully for tomorrow 16:00-16:45.'
      }
    }
  },

  ambiguous: {
    id: 'ambiguous',
    title: 'Flight II · Ambiguous Request (Wide Tier)',
    description: 'Cross-domain request bridging tickets and pager messaging. Adaptive router widens shortlist to 6 tools.',
    badge: 'Wide (6 Tools)',
    state: {
      status: 'done',
      query: 'Urgent customer escalation on API gateway latency spike, notify on-call immediately',
      source: 'replay',
      replayId: 'ambiguous',
      selectedStarId: 'tickets.page_oncall_engineer',
      decision: {
        needsToolScore: 0.96,
        category: 'tickets',
        categoryConfidence: 0.58,
        topCategories: [
          { category: 'tickets', prob: 0.58 },
          { category: 'messaging', prob: 0.32 },
          { category: 'telemetry', prob: 0.10 }
        ],
        tier: 'wide',
        shortlistCount: 6,
        shortlistedTools: [
          { id: 'tickets.page_oncall_engineer', name: 'page_oncall_engineer', score: 0.52 },
          { id: 'tickets.escalate_to_pager', name: 'escalate_to_pager', score: 0.44 },
          { id: 'messaging.publish_sns_notification', name: 'publish_sns_notification', score: 0.38 },
          { id: 'tickets.open_issue', name: 'open_issue', score: 0.31 },
          { id: 'telemetry.create_alarm', name: 'create_alarm', score: 0.22 },
          { id: 'messaging.send_sqs_message', name: 'send_sqs_message', score: 0.18 }
        ],
        latencyMs: 64
      },
      laneA: {
        stage: 'done',
        toolsSent: 240,
        inputTokens: 38420,
        outputTokens: 112,
        latencyMs: 3910,
        chosenTool: 'tickets.page_oncall_engineer',
        resultSummary: 'Dispatched emergency page to primary on-call engineer for gateway latency incident.'
      },
      laneB: {
        stage: 'done',
        toolsSent: 6,
        inputTokens: 1780,
        outputTokens: 112,
        latencyMs: 640,
        chosenTool: 'tickets.page_oncall_engineer',
        resultSummary: 'Dispatched emergency page to primary on-call engineer for gateway latency incident.'
      }
    }
  },

  no_tool: {
    id: 'no_tool',
    title: 'Flight III · General Knowledge (Zero Tools)',
    description: 'Technical knowledge inquiry requiring no external tool. Polaris eliminates all 240 tools before Bedrock invocation.',
    badge: 'Zero Tools (0)',
    state: {
      status: 'done',
      query: 'What is Amdahl’s Law and how does it limit parallel computing speedup?',
      source: 'replay',
      replayId: 'no_tool',
      selectedStarId: null,
      decision: {
        needsToolScore: 0.04,
        category: 'none',
        categoryConfidence: 0.99,
        topCategories: [],
        tier: 'no_tool',
        shortlistCount: 0,
        shortlistedTools: [],
        latencyMs: 24
      },
      laneA: {
        stage: 'done',
        toolsSent: 240,
        inputTokens: 38420,
        outputTokens: 210,
        latencyMs: 3200,
        chosenTool: null,
        resultSummary: 'Amdahl’s law states that theoretical speedup is limited by the strictly serial fraction S: Speedup = 1 / (S + (1-S)/N).'
      },
      laneB: {
        stage: 'done',
        toolsSent: 0,
        inputTokens: 240,
        outputTokens: 210,
        latencyMs: 280,
        chosenTool: null,
        resultSummary: 'Amdahl’s law states that theoretical speedup is limited by the strictly serial fraction S: Speedup = 1 / (S + (1-S)/N).'
      }
    }
  }
};
