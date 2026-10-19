import React, { useState } from 'react';
import { StarChart } from '../components/StarChart';
import { QueryPlate, RaceCockpitPlate, DecisionTracePlate } from '../components/RacePlates';
import { RaceState, Tool } from '../types';
import { REPLAYS } from '../replays';
import { McpConnectionBus } from '../components/McpConnectionBus';
import { Activity, Shield, Terminal, Zap } from 'lucide-react';

export const AtlasPage: React.FC = () => {
  const [raceState, setRaceState] = useState<RaceState>(REPLAYS.easy.state);

  const handleRunQuery = (query: string) => {
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
    <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-10">
      
      {/* MCP Interconnect Bus: Circuit Fiber Conduits */}
      <McpConnectionBus />

      {/* Bespoke Observatory Command Deck Header */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
        <div>
          {/* Hardware Telemetry Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-bold px-2.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>MCP BUS INTERCONNECT // LIVE</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-bold px-2.5 py-0.5 rounded bg-amber-950/70 border border-amber-400/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,208,97,0.15)]">
              <Shield className="w-3 h-3" />
              <span>DECIDER 2B ROUTER</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10 hidden sm:inline">
              SYS-ID: POLARIS-V21
            </span>
          </div>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-100 tracking-wide flex items-center gap-3">
            <span>The Celestial Atlas</span>
          </h1>
          <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-3">
            <span>240 Tools</span>
            <span>·</span>
            <span>12 Subsystems</span>
            <span>·</span>
            <span className="text-cyan-400 font-semibold">40ms Decision Gate</span>
          </div>
        </div>

        {/* Console Telemetry Stream */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-[#050A15]/90 backdrop-blur text-xs font-mono max-w-sm w-full space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-1">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>TELEMETRY STREAM</span>
            </span>
            <span className="text-emerald-400 font-bold">OPTIMAL</span>
          </div>
          <div className="flex justify-between text-slate-300 text-[11px]">
            <span>Average Baseline:</span>
            <span className="text-rose-400">38,420 tokens / 3.8s</span>
          </div>
          <div className="flex justify-between text-slate-300 text-[11px]">
            <span>Polaris Harvest:</span>
            <span className="text-amber-300 font-bold">1,120 tokens / 410ms</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: The Star Chart Hub (Plate 0) + The Flight Console (Plate I) */}
      <div className="relative z-20 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left: Star Chart (7 cols) */}
        <div className="xl:col-span-7">
          <StarChart 
            raceState={raceState} 
            onSelectStar={handleSelectStar} 
          />
        </div>

        {/* Right: Flight Console (Plate I) (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <QueryPlate 
            raceState={raceState}
            onRunQuery={handleRunQuery}
            onSelectReplay={handleSelectReplay}
            onReset={handleReset}
          />

          {/* Quick Instrument Overview Card */}
          <div className="p-5 rounded-xl border border-white/10 bg-[#040814]/80 text-xs font-mono space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Zap className="w-3.5 h-3.5" />
                <span>TOPOLOGICAL ROUTING STATUS</span>
              </span>
              <span className="text-amber-400">ACTIVE</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-body text-xs">
              Requests pass through Decider 2B in two typed calls (needs_tool + category), evaluating the probability matrix and dynamically calibrating the shortlist sent to Amazon Bedrock.
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 2: The Cockpit Arena - Spacious Full-Width Observatory Plates */}
      <div className="relative z-20 space-y-8">
        
        {/* Plate II: The Agent Race Cockpit (Generous full screen width) */}
        <RaceCockpitPlate raceState={raceState} />

        {/* Plate III: Decider 2B Hierarchical Trace (Generous full screen width) */}
        <DecisionTracePlate raceState={raceState} />

      </div>

    </div>
  );
};
