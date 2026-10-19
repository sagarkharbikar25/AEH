import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { RaceState } from '../types';
import { REPLAYS } from '../replays';

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

  // Compute savings
  const tokenSavingsPct = laneA.inputTokens > 0
    ? Math.round(((laneA.inputTokens - laneB.inputTokens) / laneA.inputTokens) * 100)
    : 0;

  const latencySpeedup = laneB.latencyMs > 0
    ? (laneA.latencyMs / laneB.latencyMs).toFixed(1)
    : '1.0';

  return (
    <div className="space-y-6">

      {/* PLATE I: QUERY & FLIGHT RECORDER */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">PLATE I</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">Query & Flight Selection</h2>
          </div>
          {raceState.status !== 'idle' && (
            <button 
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-[var(--line)] rounded hover:border-[var(--brass)] text-[var(--parchment-dim)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sky</span>
            </button>
          )}
        </div>

        {/* Preset Flights */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-[var(--parchment-muted)] mb-2 uppercase tracking-wider">
            Deterministic Flight Replays:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.values(REPLAYS).map((replay) => (
              <button
                key={replay.id}
                onClick={() => {
                  setInputVal(replay.state.query);
                  onSelectReplay(replay.id);
                }}
                className={`p-2.5 text-left rounded border transition-all ${
                  raceState.replayId === replay.id
                    ? 'border-[var(--brass-bright)] bg-[var(--ink-700)] text-[var(--brass-bright)] shadow-sm'
                    : 'border-[var(--line)] bg-[var(--ink-900)]/60 text-[var(--parchment-dim)] hover:border-[var(--line)] hover:text-[var(--parchment)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                  <span>{replay.id}</span>
                  <span className="text-[var(--brass)] font-semibold">{replay.badge}</span>
                </div>
                <div className="font-display font-medium text-sm text-[var(--parchment)] truncate mt-1">
                  {replay.state.query}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type query to test tool routing (e.g. Schedule sync with sales tomorrow at 2pm)..."
            className="flex-1 px-3.5 py-2.5 rounded border border-[var(--line)] bg-[var(--ink-900)] text-sm font-mono text-[var(--parchment)] placeholder:text-[var(--parchment-muted)] focus:outline-none focus:border-[var(--brass)] transition-colors"
          />
          <button
            type="submit"
            disabled={raceState.status === 'racing'}
            className="px-5 py-2.5 rounded border border-[var(--brass)] bg-[var(--brass)]/10 hover:bg-[var(--brass)]/20 text-[var(--brass-bright)] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Engage Race</span>
          </button>
        </form>
      </div>

      {/* PLATE II: THE AGENT RACE */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">PLATE II</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">The Agent Race</h2>
          </div>
          <div className="text-xs font-mono text-[var(--parchment-muted)]">
            Lane A: Full Schema (240 Tools) vs Lane B: Polaris Shortlist
          </div>
        </div>

        {/* Savings Trophy Banner */}
        {raceState.status === 'done' && (
          <div className="mb-6 p-4 rounded border border-[var(--brass)] bg-[var(--brass)]/5 backdrop-blur flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--brass)]">
                EFFICIENCY HARVEST
              </div>
              <div className="font-display text-2xl font-bold text-[var(--parchment)]">
                {tokenSavingsPct}% Fewer Prompt Tokens · {latencySpeedup}× Faster Call
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-[var(--parchment-muted)]">Baseline Tokens: </span>
                <span className="text-[var(--ember)] line-through">{laneA.inputTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[var(--parchment-muted)]">Polaris Tokens: </span>
                <span className="text-[var(--lichen)] font-bold">{laneB.inputTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[var(--parchment-muted)]">Est. Bedrock Cost: </span>
                <span className="text-[var(--brass-bright)] font-bold">~96% Saved</span>
              </div>
            </div>
          </div>
        )}

        {/* Two Lanes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LANE A: BASELINE */}
          <div className="p-4 rounded border border-[var(--line)] bg-[var(--ink-900)]/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--ember)]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--parchment-dim)]">
                    Lane A · All Tools Baseline
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--ink-800)] text-[var(--ember)]">
                  {laneA.toolsSent} Schemas
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded bg-[var(--ink-800)]/60 border border-[var(--line-dim)]">
                  <div className="text-[10px] font-mono text-[var(--parchment-muted)] uppercase">Input Tokens</div>
                  <div className="text-xl font-mono font-bold text-[var(--ember)]">
                    {laneA.inputTokens > 0 ? laneA.inputTokens.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[var(--ink-800)]/60 border border-[var(--line-dim)]">
                  <div className="text-[10px] font-mono text-[var(--parchment-muted)] uppercase">Converse Latency</div>
                  <div className="text-xl font-mono font-bold text-[var(--parchment)]">
                    {laneA.latencyMs > 0 ? `${laneA.latencyMs} ms` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--parchment-dim)] mb-2 font-mono">
                <span className="text-[var(--parchment-muted)]">Tool Picked: </span>
                <span className="text-[var(--parchment)] font-bold">{laneA.chosenTool || 'None'}</span>
              </div>
            </div>

            <div className="text-[11px] p-2 rounded bg-[var(--ink-800)] border border-[var(--line)] text-[var(--parchment-dim)] italic">
              {laneA.resultSummary || 'Awaiting race execution...'}
            </div>
          </div>

          {/* LANE B: POLARIS */}
          <div className="p-4 rounded border border-[var(--brass)] bg-[var(--ink-900)]/80 relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--brass-bright)] shadow-[0_0_6px_var(--brass-bright)]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--brass-bright)] font-semibold">
                    Lane B · Polaris Adaptive
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--brass)]/10 text-[var(--brass-bright)] font-bold">
                  {laneB.toolsSent} Schemas ({tokenSavingsPct}% less)
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded bg-[var(--ink-800)]/60 border border-[var(--brass)]/40">
                  <div className="text-[10px] font-mono text-[var(--brass)] uppercase">Input Tokens</div>
                  <div className="text-xl font-mono font-bold text-[var(--lichen)]">
                    {laneB.inputTokens > 0 ? laneB.inputTokens.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[var(--ink-800)]/60 border border-[var(--brass)]/40">
                  <div className="text-[10px] font-mono text-[var(--brass)] uppercase">Converse Latency</div>
                  <div className="text-xl font-mono font-bold text-[var(--brass-bright)]">
                    {laneB.latencyMs > 0 ? `${laneB.latencyMs} ms` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--parchment-dim)] mb-2 font-mono">
                <span className="text-[var(--parchment-muted)]">Tool Picked: </span>
                <span className="text-[var(--brass-bright)] font-bold">{laneB.chosenTool || 'None'}</span>
              </div>
            </div>

            <div className="text-[11px] p-2 rounded bg-[var(--ink-800)] border border-[var(--brass)]/30 text-[var(--parchment)] italic">
              {laneB.resultSummary || 'Awaiting race execution...'}
            </div>
          </div>

        </div>
      </div>

      {/* PLATE III: DECISION TRACE */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">PLATE III</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">Decider 2B Hierarchical Trace</h2>
          </div>
          {raceState.decision && (
            <div className="text-xs font-mono text-[var(--brass)]">
              Decision Latency: {raceState.decision.latencyMs} ms
            </div>
          )}
        </div>

        {raceState.decision ? (
          <div className="space-y-4">
            
            {/* Steps Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Step 1: needs_tool */}
              <div className="p-3 rounded border border-[var(--line)] bg-[var(--ink-800)]">
                <div className="text-[10px] font-mono text-[var(--parchment-muted)] uppercase mb-1">
                  Step 1 · Needs External Tool?
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-[var(--parchment)]">
                    {raceState.decision.needsToolScore > 0.5 ? 'YES' : 'NO'}
                  </span>
                  <span className="font-mono text-xs text-[var(--brass-bright)]">
                    {(raceState.decision.needsToolScore * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              {/* Step 2: category */}
              <div className="p-3 rounded border border-[var(--line)] bg-[var(--ink-800)]">
                <div className="text-[10px] font-mono text-[var(--parchment-muted)] uppercase mb-1">
                  Step 2 · Category Choice
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-[var(--parchment)] uppercase">
                    {raceState.decision.category}
                  </span>
                  <span className="font-mono text-xs text-[var(--brass-bright)]">
                    {(raceState.decision.categoryConfidence * 100).toFixed(0)}% Top Pick
                  </span>
                </div>
              </div>

              {/* Step 3: Adaptive Tier */}
              <div className="p-3 rounded border border-[var(--brass)] bg-[var(--brass)]/10">
                <div className="text-[10px] font-mono text-[var(--brass)] uppercase mb-1">
                  Step 3 · Adaptive Shortlist
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-[var(--brass-bright)] uppercase">
                    Tier: {raceState.decision.tier}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--lichen)]">
                    {raceState.decision.shortlistCount} Tools Sent
                  </span>
                </div>
              </div>

            </div>

            {/* Shortlisted Candidate Stars */}
            {raceState.decision.shortlistedTools.length > 0 && (
              <div>
                <div className="text-[11px] font-mono text-[var(--parchment-muted)] uppercase mb-2">
                  Shortlisted Tools Sent to Amazon Bedrock:
                </div>
                <div className="flex flex-wrap gap-2">
                  {raceState.decision.shortlistedTools.map((t) => (
                    <div 
                      key={t.id}
                      className="px-3 py-1.5 rounded border border-[var(--line)] bg-[var(--ink-900)] flex items-center gap-2 text-xs font-mono"
                    >
                      <span className="text-[var(--brass-bright)] font-bold">{t.name}</span>
                      <span className="text-[var(--parchment-muted)]">({(t.score * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-6 text-xs font-mono text-[var(--parchment-muted)]">
            Run a query or select a flight above to view the Decider 2B decision trace.
          </div>
        )}
      </div>

    </div>
  );
};
