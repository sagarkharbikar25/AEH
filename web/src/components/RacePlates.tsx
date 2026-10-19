import React, { useState } from 'react';
import { Play, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RaceState } from '../types';
import { REPLAYS } from '../replays';
import { BorderBeamFrame } from './BorderBeamFrame';

interface RacePlatesProps {
  raceState: RaceState;
  onRunQuery: (query: string) => void;
  onSelectReplay: (replayId: string) => void;
  onReset: () => void;
}

export const RacePlates: React.FC<RacePlatesProps> = ({
  raceState,
  onRunQuery,
  onSelectReplay,
  onReset
}) => {
  const [inputVal, setInputVal] = useState(raceState.query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onRunQuery(inputVal.trim());
  };

  const laneA = raceState.laneA;
  const laneB = raceState.laneB;

  const tokenSavingsPct = laneA.inputTokens > 0
    ? Math.round(((laneA.inputTokens - laneB.inputTokens) / laneA.inputTokens) * 100)
    : 0;

  const latencySpeedup = laneB.latencyMs > 0
    ? (laneA.latencyMs / laneB.latencyMs).toFixed(1)
    : '1.0';

  return (
    <div className="space-y-6">

      {/* PLATE I: QUERY & FLIGHT RECORDER */}
      <BorderBeamFrame 
        activeBeam={true}
        terminalLabel="PLATE I // FLIGHT CONSOLE"
        portId="PORT 8000"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase">
              PLATE I
            </span>
            <span className="text-slate-500 font-mono text-xs">·</span>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-100">
              Query & Flight Replay
            </h2>
          </div>
          {raceState.status !== 'idle' && (
            <button 
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono border border-white/10 rounded-md hover:border-amber-400 text-slate-300 hover:text-white transition-all bg-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Flight Replay Switches */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Preset Flight Recordings:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {Object.values(REPLAYS).map((replay) => (
              <button
                key={replay.id}
                onClick={() => {
                  setInputVal(replay.state.query);
                  onSelectReplay(replay.id);
                }}
                className={`p-3 text-left rounded-lg border transition-all ${
                  raceState.replayId === replay.id
                    ? 'border-amber-400/80 bg-amber-950/20 text-amber-200 shadow-[0_0_15px_rgba(245,208,97,0.15)]'
                    : 'border-white/10 bg-[#050A15]/70 text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-slate-400 font-semibold">{replay.id}</span>
                  <span className="text-amber-400 font-bold">{replay.badge}</span>
                </div>
                <div className="font-display font-medium text-sm text-slate-200 truncate">
                  {replay.state.query}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask anything (e.g. Schedule team sync tomorrow at 3pm)..."
            className="flex-1 px-4 py-3 rounded-lg border border-white/10 bg-[#02040A] text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          <button
            type="submit"
            disabled={raceState.status === 'racing'}
            className="px-6 py-3 rounded-lg border border-amber-400/80 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 text-amber-300 font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,208,97,0.2)] disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Engage</span>
          </button>
        </form>
      </BorderBeamFrame>

      {/* PLATE II: THE AGENT RACE */}
      <BorderBeamFrame 
        activeBeam={true}
        terminalLabel="PLATE II // THE AGENT RACE"
        portId="DUAL LANE BUS"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase">
              PLATE II
            </span>
            <span className="text-slate-500 font-mono text-xs">·</span>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-100">
              The Agent Race
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            All 240 Tools vs Polaris Shortlist
          </div>
        </div>

        {/* Savings Trophy Banner */}
        <AnimatePresence>
          {raceState.status === 'done' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5 p-4 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-950/30 via-yellow-950/20 to-transparent backdrop-blur flex flex-wrap items-center justify-between gap-4 shadow-[0_0_20px_rgba(245,208,97,0.1)]"
            >
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EFFICIENCY HARVEST RESULT</span>
                </div>
                <div className="font-display text-2xl lg:text-3xl font-bold text-slate-100 mt-0.5">
                  {tokenSavingsPct}% Fewer Tokens · {latencySpeedup}× Faster Call
                </div>
              </div>
              <div className="flex items-center gap-5 text-xs font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">BASELINE TOKENS</div>
                  <div className="text-rose-400 line-through font-bold text-sm">
                    {laneA.inputTokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">POLARIS TOKENS</div>
                  <div className="text-emerald-400 font-bold text-sm">
                    {laneB.inputTokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">EST. BEDROCK SAVINGS</div>
                  <div className="text-amber-300 font-bold text-sm">~96% Saved</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dual Lanes Cockpit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LANE A: BASELINE */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#02040A]/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    Lane A · All Tools Baseline
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300">
                  {laneA.toolsSent} Schemas
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Input Tokens</div>
                  <div className="text-xl font-mono font-bold text-rose-400 mt-1">
                    {laneA.inputTokens > 0 ? laneA.inputTokens.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Converse Latency</div>
                  <div className="text-xl font-mono font-bold text-slate-200 mt-1">
                    {laneA.latencyMs > 0 ? `${laneA.latencyMs} ms` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 mb-2 font-mono">
                <span className="text-slate-400">Tool Chosen: </span>
                <span className="text-slate-100 font-bold">{laneA.chosenTool || 'None'}</span>
              </div>
            </div>

            <div className="text-[11px] p-2.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 italic">
              {laneA.resultSummary || 'Awaiting race engagement...'}
            </div>
          </div>

          {/* LANE B: POLARIS */}
          <div className="p-4 rounded-xl border border-amber-400/50 bg-[#050A15]/90 relative overflow-hidden flex flex-col justify-between shadow-[0_0_20px_rgba(245,208,97,0.1)]">
            <div>
              <div className="flex items-center justify-between border-b border-amber-400/20 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#FDE047]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold">
                    Lane B · Polaris Adaptive
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-400/40 text-amber-300 font-bold">
                  {laneB.toolsSent} Schemas ({tokenSavingsPct}% less)
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-400/30">
                  <div className="text-[10px] font-mono text-amber-300/80 uppercase">Input Tokens</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    {laneB.inputTokens > 0 ? laneB.inputTokens.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-400/30">
                  <div className="text-[10px] font-mono text-amber-300/80 uppercase">Converse Latency</div>
                  <div className="text-xl font-mono font-bold text-amber-300 mt-1">
                    {laneB.latencyMs > 0 ? `${laneB.latencyMs} ms` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 mb-2 font-mono">
                <span className="text-slate-400">Tool Chosen: </span>
                <span className="text-amber-300 font-bold">{laneB.chosenTool || 'None'}</span>
              </div>
            </div>

            <div className="text-[11px] p-2.5 rounded-lg bg-amber-950/30 border border-amber-400/20 text-slate-200 italic">
              {laneB.resultSummary || 'Awaiting race engagement...'}
            </div>
          </div>

        </div>
      </BorderBeamFrame>

      {/* PLATE III: DECISION TRACE */}
      <BorderBeamFrame 
        activeBeam={true}
        terminalLabel="PLATE III // DECISION TRACE"
        portId="HIERARCHICAL V21"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase">
              PLATE III
            </span>
            <span className="text-slate-500 font-mono text-xs">·</span>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-100">
              Decider 2B Hierarchical Trace
            </h2>
          </div>
          {raceState.decision && (
            <div className="text-xs font-mono text-cyan-400">
              Routing Latency: {raceState.decision.latencyMs} ms
            </div>
          )}
        </div>

        {raceState.decision ? (
          <div className="space-y-4">
            
            {/* Steps Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Step 1: needs_tool */}
              <div className="p-3.5 rounded-lg border border-white/10 bg-[#02040A]">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Step 1 · Needs Tool?
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-slate-100">
                    {raceState.decision.needsToolScore > 0.5 ? 'YES' : 'NO'}
                  </span>
                  <span className="font-mono text-xs text-cyan-400 font-bold">
                    {(raceState.decision.needsToolScore * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              {/* Step 2: category */}
              <div className="p-3.5 rounded-lg border border-white/10 bg-[#02040A]">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Step 2 · Category
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-slate-100 uppercase">
                    {raceState.decision.category}
                  </span>
                  <span className="font-mono text-xs text-amber-300 font-bold">
                    {(raceState.decision.categoryConfidence * 100).toFixed(0)}% Top Pick
                  </span>
                </div>
              </div>

              {/* Step 3: Adaptive Tier */}
              <div className="p-3.5 rounded-lg border border-amber-400/40 bg-amber-950/20">
                <div className="text-[10px] font-mono text-amber-400 uppercase mb-1">
                  Step 3 · Shortlist Tier
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-amber-300 uppercase">
                    {raceState.decision.tier}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {raceState.decision.shortlistCount} Tools
                  </span>
                </div>
              </div>

            </div>

            {/* Shortlisted Tools */}
            {raceState.decision.shortlistedTools.length > 0 && (
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">
                  Shortlisted Tools Sent to Amazon Bedrock:
                </div>
                <div className="flex flex-wrap gap-2">
                  {raceState.decision.shortlistedTools.map((t) => (
                    <div 
                      key={t.id}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#02040A] flex items-center gap-2 text-xs font-mono"
                    >
                      <span className="text-amber-300 font-bold">{t.name}</span>
                      <span className="text-slate-400">({(t.score * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-6 text-xs font-mono text-slate-400">
            Select a flight above to view the Decider 2B decision trace.
          </div>
        )}
      </BorderBeamFrame>

    </div>
  );
};
