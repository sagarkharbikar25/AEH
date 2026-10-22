/**
 * POLARIS Race State Machine Reducer
 *
 * Drives the live flight console and recorded flight replay through the exact same
 * 7 SSE contract event types:
 * - decision
 * - shortlist
 * - lane_start
 * - lane_tokens
 * - lane_done
 * - final
 * - error
 */

import { type RaceEvent } from '@polaris/contracts';
import { type RaceState, type LaneMetrics } from '../types.js';

export const INITIAL_LANE_METRICS: LaneMetrics = {
  stage: 'idle',
  toolsSent: 0,
  inputTokens: 0,
  outputTokens: 0,
  latencyMs: 0,
  chosenTool: null,
  resultSummary: null,
};

export const INITIAL_RACE_STATE: RaceState = {
  status: 'idle',
  query: '',
  source: 'live',
  laneA: { ...INITIAL_LANE_METRICS },
  laneB: { ...INITIAL_LANE_METRICS },
};

export type RaceAction =
  | { type: 'START_RACE'; query: string; source?: 'live' | 'replay'; replayId?: string }
  | { type: 'RESET_RACE' }
  | { type: 'SET_SELECTED_STAR'; starId: string | null }
  | { type: 'SSE_EVENT'; event: RaceEvent };

export function raceReducer(state: RaceState, action: RaceAction): RaceState {
  switch (action.type) {
    case 'START_RACE':
      return {
        ...state,
        status: 'deciding',
        query: action.query,
        source: action.source || 'live',
        replayId: action.replayId,
        decision: undefined,
        error: undefined,
        selectedStarId: null,
        laneA: { ...INITIAL_LANE_METRICS, stage: 'reading_sky' },
        laneB: { ...INITIAL_LANE_METRICS, stage: 'reading_sky' },
      };

    case 'RESET_RACE':
      return {
        ...INITIAL_RACE_STATE,
        selectedStarId: state.selectedStarId,
      };

    case 'SET_SELECTED_STAR':
      return {
        ...state,
        selectedStarId: action.starId,
      };

    case 'SSE_EVENT': {
      const ev = action.event;
      switch (ev.type) {
        case 'decision':
          return {
            ...state,
            status: 'deciding',
            decision: {
              needsToolScore: ev.needsTool ? ev.confidence : 0.05,
              category: ev.topCategories[0]?.category || 'unknown',
              categoryConfidence: ev.topCategories[0]?.p || ev.confidence,
              topCategories: ev.topCategories.map((c) => ({ category: c.category, prob: c.p })),
              tier: 'wide',
              shortlistCount: 0,
              shortlistedTools: [],
              latencyMs: ev.latencyMs,
            },
          };

        case 'shortlist':
          return {
            ...state,
            decision: state.decision
              ? {
                  ...state.decision,
                  tier: ev.tier,
                  shortlistCount: ev.totalTools,
                  shortlistedTools: ev.tools,
                }
              : undefined,
            selectedStarId: ev.tools[0]?.id || state.selectedStarId,
          };

        case 'lane_start': {
          const isBaseline = ev.lane === 'baseline';
          const targetKey = isBaseline ? 'laneA' : 'laneB';
          return {
            ...state,
            status: 'racing',
            [targetKey]: {
              ...state[targetKey],
              stage: 'calling_tool',
              toolsSent: ev.toolsSent,
            },
          };
        }

        case 'lane_tokens': {
          const isBaseline = ev.lane === 'baseline';
          const targetKey = isBaseline ? 'laneA' : 'laneB';
          return {
            ...state,
            [targetKey]: {
              ...state[targetKey],
              inputTokens: ev.inputTokens,
              outputTokens: ev.outputTokens,
              latencyMs: ev.elapsedMs,
            },
          };
        }

        case 'lane_done': {
          const isBaseline = ev.lane === 'baseline';
          const targetKey = isBaseline ? 'laneA' : 'laneB';
          return {
            ...state,
            [targetKey]: {
              ...state[targetKey],
              stage: 'done',
              toolsSent: ev.toolsSent,
              inputTokens: ev.inputTokens,
              outputTokens: ev.outputTokens,
              latencyMs: ev.latencyMs,
              chosenTool: ev.chosenTool,
              resultSummary: ev.chosenTool ? `Tool: ${ev.chosenTool}` : 'No tool required',
            },
          };
        }

        case 'final':
          return {
            ...state,
            status: 'done',
            laneA: {
              ...state.laneA,
              stage: 'done',
              toolsSent: ev.laneA.toolsSent,
              inputTokens: ev.laneA.inputTokens,
              outputTokens: ev.laneA.outputTokens,
              latencyMs: ev.laneA.latencyMs,
              chosenTool: ev.laneA.chosenTool,
            },
            laneB: {
              ...state.laneB,
              stage: 'done',
              toolsSent: ev.laneB.toolsSent,
              inputTokens: ev.laneB.inputTokens,
              outputTokens: ev.laneB.outputTokens,
              latencyMs: ev.laneB.latencyMs,
              chosenTool: ev.laneB.chosenTool,
            },
          };

        case 'error':
          return {
            ...state,
            status: 'error',
            error: {
              code: ev.error.code,
              message: ev.error.message,
              requestId: ev.error.requestId,
              retryAfter: ev.error.retryAfter,
            },
          };

        default:
          return state;
      }
    }

    default:
      return state;
  }
}
