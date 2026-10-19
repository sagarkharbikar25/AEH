import React, { useState } from 'react';
import { StarChart } from '../components/StarChart';
import { RacePlates } from '../components/RacePlates';
import { RaceState, Tool } from '../types';
import { REPLAYS } from '../replays';

export const AtlasPage: React.FC = () => {
  // Start with default easy flight state so user immediately sees live metrics
  const [raceState, setRaceState] = useState<RaceState>(REPLAYS.easy.state);

  const handleRunQuery = (query: string) => {
    // Check if query matches or simulate live race
    const lower = query.toLowerCase();
    let matchedReplay = REPLAYS.easy;
    if (lower.includes('amdahl') || lower.includes('law') || lower.includes('what is') || lower.includes('explain')) {
      matchedReplay = REPLAYS.no_tool;
    } else if (lower.includes('urgent') || lower.includes('escalat') || lower.includes('pager') || lower.includes('latency') || lower.includes('issue')) {
      matchedReplay = REPLAYS.ambiguous;
    }

    setRaceState({
      ...matchedReplay.state,
      query,
      source: 'live',
      replayId: undefined
    });
  };

  const handleSelectReplay = (replayId: string) => {
    const replay = REPLAYS[replayId];
    if (replay) {
      setRaceState(replay.state);
    }
  };

  const handleReset = () => {
    setRaceState({
      status: 'idle',
      query: '',
      source: 'live',
      laneA: {
        stage: 'idle',
        toolsSent: 240,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        chosenTool: null,
        resultSummary: null
      },
      laneB: {
        stage: 'idle',
        toolsSent: 0,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        chosenTool: null,
        resultSummary: null
      }
    });
  };

  const handleSelectStar = (star: Tool) => {
    setRaceState((prev) => ({
      ...prev,
      selectedStarId: star.id
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--line)] pb-5 gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--brass)]">
            DECIDER 2B TOOL ROUTER × AMAZON BEDROCK
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--parchment)] tracking-wide">
            The Celestial Atlas
          </h1>
        </div>
        <p className="text-sm font-body text-[var(--parchment-dim)] max-w-md">
          A high-speed 2B parameter decider in front of the LLM. Narrows 240 tools to a calibrated shortlist of 1 to 6 in ~40ms.
        </p>
      </div>

      {/* Main Grid: Star Chart + Plates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Star Chart (7 cols) */}
        <div className="lg:col-span-7">
          <StarChart 
            raceState={raceState} 
            onSelectStar={handleSelectStar} 
          />
        </div>

        {/* Right: Plates (5 cols) */}
        <div className="lg:col-span-5">
          <RacePlates 
            raceState={raceState}
            onRunQuery={handleRunQuery}
            onSelectReplay={handleSelectReplay}
            onReset={handleReset}
          />
        </div>

      </div>

    </div>
  );
};
