import React, { useState } from 'react';
import { Play, RotateCcw, Zap, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RaceState } from '../types';
import { REPLAYS } from '../replays';
import { BorderBeamFrame } from './BorderBeamFrame';

/* =========================================================================
   PLATE I: QUERY & FLIGHT CONSOLE
   ========================================================================= */
interface QueryPlateProps {
  raceState: RaceState;
  onRunQuery: (query: string) => void;
  onSelectReplay: (replayId: string) => void;
  onReset: () => void;
}

export const QueryPlate: React.FC<QueryPlateProps> = ({
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

  return (
    <BorderBeamFrame 
      activeBeam={true}
      terminalLabel="PLATE I // FLIGHT CONSOLE"
      portId="PORT 8000"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-400/40">
            PLATE I
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-100 tracking-wide">
            Query & Flight Replay
          </h2>
        </div>
        {raceState.status !== 'idle' && (
          <button 
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-white/10 rounded-lg hover:border-amber-400 text-slate-300 hover:text-white transition-all bg-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Preset Flight Recordings */}
      <div className="mb-5">
        <div className="text-[11px] font-mono text-slate-400 mb-2.5 uppercase tracking-wider flex items-center gap-2 font-bold">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Preset Flight Scenarios:</span>
        </div>
        <div className="space-y-2.5">
          {Object.values(REPLAYS).map((replay) => (
            <button
              key={replay.id}
              onClick={() => {
                setInputVal(replay.state.query);
                onSelectReplay(replay.id);
              }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                raceState.replayId === replay.id
                  ? 'border-amber-400 bg-amber-950/30 text-amber-100 shadow-[0_0_20px_rgba(245,208,97,0.15)] ring-1 ring-amber-400/50'
                  : 'border-white/10 bg-[#050A15]/70 text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-slate-300 px-2 py-0.5 rounded bg-white/10 border border-white/10 whitespace-nowrap">
                    {replay.id}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/70 border border-amber-400/40 whitespace-nowrap">
                    {replay.badge}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1 shrink-0">
                  <span>Load</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <p className="font-mono text-xs text-slate-200 leading-relaxed">
                "{replay.state.query}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Query Input & Action Bar */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask anything (e.g. Schedule team sync tomorrow at 3pm)..."
            className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-[#02040A] text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={raceState.status === 'racing'}
          className="w-full py-3.5 rounded-xl border border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_18px_rgba(245,208,97,0.2)] disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Engage Flight · Send to Decider 2B</span>
        </button>
      </form>
    </BorderBeamFrame>
  );
};


/* =========================================================================
   PLATE II: THE AGENT RACE COCKPIT (SPACIOUS COMPARATIVE LANES)
   ========================================================================= */
interface RaceCockpitPlateProps {
  raceState: RaceState;
}

export const RaceCockpitPlate: React.FC<RaceCockpitPlateProps> = ({ raceState }) => {
  const laneA = raceState.laneA;
  const laneB = raceState.laneB;

  const tokenSavingsPct = laneA.inputTokens > 0
    ? Math.round(((laneA.inputTokens - laneB.inputTokens) / laneA.inputTokens) * 100)
    : 0;

  const latencySpeedup = laneB.latencyMs > 0
    ? (laneA.latencyMs / laneB.latencyMs).toFixed(1)
    : '1.0';

  return (
    <BorderBeamFrame 
      activeBeam={true}
      terminalLabel="PLATE II // THE AGENT RACE"
      portId="DUAL LANE BUS"
    >
      {/* Spacious Header with Title and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 mb-5 gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-400/40 whitespace-nowrap">
            PLATE II
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100 tracking-wide whitespace-nowrap">
            The Agent Race
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap self-start sm:self-auto">
          Full 240 Tools vs Polaris Shortlist
        </div>
      </div>

      {/* Savings Trophy Banner */}
      <AnimatePresence>
        {raceState.status === 'done' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 lg:p-5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-transparent backdrop-blur flex flex-wrap items-center justify-between gap-4 shadow-[0_0_24px_rgba(245,208,97,0.12)]"
          >
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold flex items-center gap-2 mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EFFICIENCY HARVEST RESULT</span>
              </div>
              <div className="font-display text-2xl lg:text-3xl font-bold text-slate-100">
                {tokenSavingsPct}% Fewer Tokens · {latencySpeedup}× Faster Call
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <div className="text-slate-400 text-[10px]">BASELINE</div>
                <div className="text-rose-400 line-through font-bold text-base">
                  {laneA.inputTokens.toLocaleString()} tok
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">POLARIS</div>
                <div className="text-emerald-400 font-bold text-base">
                  {laneB.inputTokens.toLocaleString()} tok
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">SAVINGS</div>
                <div className="text-amber-300 font-bold text-base">~96% Saved</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stacked Comparative Lanes with Generous Horizontal Width */}
      <div className="space-y-4">
        
        {/* LANE A: BASELINE (SPACIOUS FULL WIDTH) */}
        <div className="p-4 lg:p-5 rounded-xl border border-white/10 bg-[#02040A]/90 transition-all hover:border-white/20">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 mb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono text-sm uppercase tracking-wider text-slate-200 font-bold">
                Lane A · All Tools Baseline
              </span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 font-bold">
              {laneA.toolsSent} Schemas Sent
            </span>
          </div>

          {/* Metrics & Tool Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Prompt Input Tokens:</span>
              <span className="text-lg font-mono font-bold text-rose-400">
                {laneA.inputTokens > 0 ? laneA.inputTokens.toLocaleString() : '—'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Bedrock Latency:</span>
              <span className="text-lg font-mono font-bold text-slate-200">
                {laneA.latencyMs > 0 ? `${laneA.latencyMs} ms` : '—'}
              </span>
            </div>
          </div>

          {/* Tool Chosen Row */}
          <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-400">Chosen Tool Execution:</span>
            <span className="text-slate-100 font-bold font-mono px-2 py-0.5 rounded bg-white/10 border border-white/10">
              {laneA.chosenTool || 'Awaiting execution...'}
            </span>
          </div>

          <div className="text-xs p-2.5 rounded-lg bg-white/5 text-slate-400 italic">
            {laneA.resultSummary || 'Awaiting race engagement...'}
          </div>
        </div>

        {/* LANE B: POLARIS (SPACIOUS FULL WIDTH) */}
        <div className="p-4 lg:p-5 rounded-xl border border-amber-400/60 bg-[#050A15]/95 shadow-[0_0_24px_rgba(245,208,97,0.1)] transition-all">
          <div className="flex flex-wrap items-center justify-between border-b border-amber-400/20 pb-3 mb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#FDE047]" />
              <span className="font-mono text-sm uppercase tracking-wider text-amber-300 font-bold">
                Lane B · Polaris Adaptive Shortlist
              </span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-950/60 border border-amber-400/40 text-amber-300 font-bold">
              {laneB.toolsSent} Schemas ({tokenSavingsPct}% less)
            </span>
          </div>

          {/* Metrics & Tool Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-400/30 flex items-center justify-between">
              <span className="text-xs font-mono text-amber-300/80">Prompt Input Tokens:</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {laneB.inputTokens > 0 ? laneB.inputTokens.toLocaleString() : '—'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-400/30 flex items-center justify-between">
              <span className="text-xs font-mono text-amber-300/80">Bedrock Latency:</span>
              <span className="text-lg font-mono font-bold text-amber-300">
                {laneB.latencyMs > 0 ? `${laneB.latencyMs} ms` : '—'}
              </span>
            </div>
          </div>

          {/* Tool Chosen Row */}
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-400/30 text-xs font-mono mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-amber-300/80">Chosen Tool Execution:</span>
            <span className="text-amber-300 font-bold font-mono px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/40">
              {laneB.chosenTool || 'Awaiting execution...'}
            </span>
          </div>

          <div className="text-xs p-2.5 rounded-lg bg-amber-950/30 text-slate-200 italic">
            {laneB.resultSummary || 'Awaiting race engagement...'}
          </div>
        </div>

      </div>
    </BorderBeamFrame>
  );
};


/* =========================================================================
   PLATE III: DECISION TRACE (SPACIOUS HORIZONTAL SIGNAL FLOW)
   ========================================================================= */
interface DecisionTracePlateProps {
  raceState: RaceState;
}

export const DecisionTracePlate: React.FC<DecisionTracePlateProps> = ({ raceState }) => {
  return (
    <BorderBeamFrame 
      activeBeam={true}
      terminalLabel="PLATE III // DECISION TRACE"
      portId="HIERARCHICAL V21"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 mb-5 gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-400/40 whitespace-nowrap">
            PLATE III
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100 tracking-wide whitespace-nowrap">
            Decider 2B Hierarchical Trace
          </h2>
        </div>
        {raceState.decision && (
          <div className="text-xs font-mono text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 whitespace-nowrap self-start sm:self-auto">
            Routing Latency: {raceState.decision.latencyMs} ms
          </div>
        )}
      </div>

      {raceState.decision ? (
        <div className="space-y-4">
          
          {/* Step 1: Needs Tool Gate */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#02040A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">
                STEP 1 · EXTERNAL TOOL GATE
              </div>
              <div className="text-xs text-slate-300 font-body">
                Evaluates whether user prompt requires an external tool or general knowledge
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="font-display text-2xl font-bold text-slate-100">
                {raceState.decision.needsToolScore > 0.5 ? 'YES' : 'NO'}
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 whitespace-nowrap">
                {(raceState.decision.needsToolScore * 100).toFixed(0)}% Confidence
              </span>
            </div>
          </div>

          {/* Step 2: Category Choice */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#02040A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">
                STEP 2 · TARGET SUBSYSTEM CATEGORY
              </div>
              <div className="text-xs text-slate-300 font-body">
                Narrows 240 instruments down to top candidate category cluster
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="font-display text-xl font-bold text-amber-300 uppercase">
                {raceState.decision.category}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-400/40 whitespace-nowrap">
                {(raceState.decision.categoryConfidence * 100).toFixed(0)}% Probability
              </span>
            </div>
          </div>

          {/* Step 3: Adaptive Shortlist Tier */}
          <div className="p-4 rounded-xl border border-amber-400/40 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold mb-1">
                STEP 3 · CONFIDENCE-ADAPTIVE SHORTLIST
              </div>
              <div className="text-xs text-slate-300 font-body">
                Calibrated score thresholds determine tools sent to Amazon Bedrock
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="font-display text-xl font-bold text-amber-300 uppercase">
                TIER: {raceState.decision.tier}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 whitespace-nowrap">
                {raceState.decision.shortlistCount} Tools Shortlisted
              </span>
            </div>
          </div>

          {/* Shortlisted Tools Sent to Bedrock */}
          {raceState.decision.shortlistedTools.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-2.5 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Shortlisted Schemas Transmitted to Amazon Bedrock Converse:</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {raceState.decision.shortlistedTools.map((t) => (
                  <div 
                    key={t.id}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#02040A] flex items-center gap-2 text-xs font-mono"
                  >
                    <span className="text-amber-300 font-bold">{t.name}</span>
                    <span className="text-cyan-400 font-semibold">({(t.score * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-8 text-xs font-mono text-slate-400">
          Select a flight above to view the Decider 2B decision trace.
        </div>
      )}
    </BorderBeamFrame>
  );
};

/* Combined export for backward compatibility */
export const RacePlates: React.FC<QueryPlateProps> = (props) => {
  return (
    <div className="space-y-6">
      <QueryPlate {...props} />
      <RaceCockpitPlate raceState={props.raceState} />
      <DecisionTracePlate raceState={props.raceState} />
    </div>
  );
};
