/**
 * POLARIS Live Race Stream & Replay Hook
 *
 * Connects to /api/race/:id/stream via EventSource or animates a recorded flight log
 * through the exact same raceReducer.
 */

import { useEffect, useRef } from 'react';
import { RaceEventSchema, type Replay } from '@polaris/contracts';
import { api } from '../lib/api.js';
import { RaceAction } from '../state/raceReducer.js';

interface UseRaceStreamOptions {
  runId?: string | null;
  replay?: Replay | null;
  dispatch: React.Dispatch<RaceAction>;
  onComplete?: () => void;
  onError?: (err: any) => void;
}

export function useRaceStream({
  runId,
  replay,
  dispatch,
  onComplete,
  onError,
}: UseRaceStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const replayTimerRef = useRef<any[]>([]);

  // 1. Replay Mode Execution
  useEffect(() => {
    if (!replay || !replay.events || replay.events.length === 0) return;

    // Clear previous timers
    replayTimerRef.current.forEach(clearTimeout);
    replayTimerRef.current = [];

    dispatch({
      type: 'START_RACE',
      query: replay.query,
      source: 'replay',
      replayId: replay.id,
    });

    let cumulativeDelayMs = 80;
    replay.events.forEach((ev, idx) => {
      let stepDelay = 220;
      if (ev.type === 'lane_start') stepDelay = 180;
      if (ev.type === 'lane_tokens') stepDelay = 160;
      if (ev.type === 'lane_done') stepDelay = 320;
      if (ev.type === 'final') stepDelay = 200;

      cumulativeDelayMs += stepDelay;

      const timer = setTimeout(() => {
        dispatch({ type: 'SSE_EVENT', event: ev });
        if (idx === replay.events.length - 1) {
          onComplete?.();
        }
      }, cumulativeDelayMs);

      replayTimerRef.current.push(timer);
    });

    return () => {
      replayTimerRef.current.forEach(clearTimeout);
      replayTimerRef.current = [];
    };
  }, [replay]);

  // 2. Live SSE Stream Execution
  useEffect(() => {
    if (!runId) return;

    const streamUrl = `${api.getBaseUrl()}/api/race/${runId}/stream`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    const eventTypes = [
      'decision',
      'shortlist',
      'lane_start',
      'lane_tokens',
      'lane_done',
      'final',
      'error',
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data);
          const parsed = RaceEventSchema.parse(raw);
          dispatch({ type: 'SSE_EVENT', event: parsed });

          if (parsed.type === 'final') {
            onComplete?.();
            es.close();
          } else if (parsed.type === 'error') {
            onError?.(parsed.error);
            es.close();
          }
        } catch (parseErr) {
          console.warn('[useRaceStream] Event parse warning:', parseErr);
        }
      });
    });

    es.onerror = (err) => {
      console.warn('[useRaceStream] EventSource connection issue:', err);
      // EventSource automatically attempts reconnection
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [runId]);
}
