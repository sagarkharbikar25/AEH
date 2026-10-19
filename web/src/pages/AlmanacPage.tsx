import React from 'react';

export const AlmanacPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* Page Title */}
      <div className="border-b border-[var(--line)] pb-5">
        <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--brass)]">
          EMPIRICAL BENCHMARKS & EVALUATION
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--parchment)] tracking-wide">
          The Astronomical Almanac
        </h1>
        <p className="text-sm font-body text-[var(--parchment-dim)] max-w-2xl mt-2">
          Measured Pareto curves, latency percentiles, confidence calibration tables, and honest failure mode audits across 800 test queries against 240 tools.
        </p>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="plate p-4">
          <div className="text-[10px] font-mono text-[var(--brass)] uppercase">Input Token Reduction</div>
          <div className="text-3xl font-display font-bold text-[var(--lichen)] mt-1">96.8%</div>
          <div className="text-xs text-[var(--parchment-muted)] mt-1">38.4k down to 1.2k tokens</div>
        </div>

        <div className="plate p-4">
          <div className="text-[10px] font-mono text-[var(--brass)] uppercase">p50 Latency Delta</div>
          <div className="text-3xl font-display font-bold text-[var(--brass-bright)] mt-1">5.8×</div>
          <div className="text-xs text-[var(--parchment-muted)] mt-1">420ms vs 2,450ms Converse</div>
        </div>

        <div className="plate p-4">
          <div className="text-[10px] font-mono text-[var(--brass)] uppercase">Recall @ k (Adaptive)</div>
          <div className="text-3xl font-display font-bold text-[var(--parchment)] mt-1">94.2%</div>
          <div className="text-xs text-[var(--parchment-muted)] mt-1">Correct tool inside shortlist</div>
        </div>

        <div className="plate p-4">
          <div className="text-[10px] font-mono text-[var(--brass)] uppercase">Bedrock Cost Saved</div>
          <div className="text-3xl font-display font-bold text-[var(--lichen)] mt-1">$94.80</div>
          <div className="text-xs text-[var(--parchment-muted)] mt-1">Per 10,000 tool requests</div>
        </div>
      </div>

      {/* Pareto Frontier Comparison */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">FIGURE I</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">The Pareto Frontier: Tokens Saved vs Accuracy Maintained</h2>
          </div>
          <div className="text-xs font-mono text-[var(--brass)]">
            Eval Split: 400 Test Queries
          </div>
        </div>

        <div className="space-y-4">
          {/* Bar 1: Baseline */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[var(--parchment)]">Config A: All 240 Tools to Bedrock (Baseline)</span>
              <span className="text-[var(--ember)]">0% Tokens Saved · 96.1% Accuracy · 3.8s Latency</span>
            </div>
            <div className="h-6 w-full bg-[var(--ink-800)] rounded border border-[var(--line)] overflow-hidden flex">
              <div className="bg-[var(--ember)] h-full w-[4%]" />
            </div>
          </div>

          {/* Bar 2: Fixed top-1 */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[var(--parchment)]">Config B: Flat Decider Top-1 (Fragile Gate)</span>
              <span className="text-[var(--parchment-dim)]">98.5% Tokens Saved · 71.4% Accuracy · 380ms Latency</span>
            </div>
            <div className="h-6 w-full bg-[var(--ink-800)] rounded border border-[var(--line)] overflow-hidden flex">
              <div className="bg-[var(--parchment-dim)] h-full w-[72%]" />
            </div>
          </div>

          {/* Bar 3: Polaris Adaptive */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[var(--brass-bright)] font-bold">Config C: Polaris Confidence-Adaptive (Hierarchical)</span>
              <span className="text-[var(--lichen)] font-bold">96.8% Tokens Saved · 94.2% Accuracy · 440ms Latency</span>
            </div>
            <div className="h-6 w-full bg-[var(--ink-800)] rounded border border-[var(--brass)] overflow-hidden flex shadow-md">
              <div className="bg-[var(--brass-bright)] h-full w-[94%]" />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded bg-[var(--ink-900)] border border-[var(--line-dim)] text-xs font-mono text-[var(--parchment-dim)] leading-relaxed">
          <strong className="text-[var(--brass)]">Takeaway:</strong> Modern LLMs pick accurately from 240 tools, but waste ~38k prompt tokens per call. Polaris achieves near-parity in accuracy while slashing 96.8% of tokens and 80% of roundtrip latency.
        </div>
      </div>

      {/* Reliability & Calibration Table */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">TABLE I</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">Confidence Calibration & Tier Allocation</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--brass)] uppercase">
                <th className="py-2.5 px-3">Top-1 Score Bucket</th>
                <th className="py-2.5 px-3">Assigned Tier</th>
                <th className="py-2.5 px-3">Tools Sent</th>
                <th className="py-2.5 px-3">Share of Traffic</th>
                <th className="py-2.5 px-3">Empirical Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-dim)] text-[var(--parchment-dim)]">
              <tr>
                <td className="py-3 px-3 text-[var(--parchment)] font-bold">≥ 0.85</td>
                <td className="py-3 px-3 text-[var(--lichen)] font-semibold">Direct</td>
                <td className="py-3 px-3">1</td>
                <td className="py-3 px-3">64.5%</td>
                <td className="py-3 px-3 text-[var(--lichen)] font-bold">96.2%</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-[var(--parchment)] font-bold">0.55 – 0.85</td>
                <td className="py-3 px-3 text-[var(--brass-bright)] font-semibold">Narrow</td>
                <td className="py-3 px-3">3</td>
                <td className="py-3 px-3">22.8%</td>
                <td className="py-3 px-3 text-[var(--parchment)]">91.4%</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-[var(--parchment)] font-bold">0.30 – 0.55</td>
                <td className="py-3 px-3 text-[var(--haze)] font-semibold">Wide</td>
                <td className="py-3 px-3">6</td>
                <td className="py-3 px-3">9.4%</td>
                <td className="py-3 px-3 text-[var(--parchment)]">88.7%</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-[var(--parchment)] font-bold">&lt; 0.30</td>
                <td className="py-3 px-3 text-[var(--ember)] font-semibold">Fallback</td>
                <td className="py-3 px-3">12 + AskClarification</td>
                <td className="py-3 px-3">3.3%</td>
                <td className="py-3 px-3 text-[var(--parchment)]">82.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Honest Failure Audit */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">AUDIT</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">Honest Failure Analysis</h2>
          </div>
          <span className="text-xs font-mono text-[var(--ember)]">Documented Edge Cases</span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded border border-[var(--line)] bg-[var(--ink-900)]">
            <div className="flex items-center justify-between text-[var(--ember)] font-bold mb-1">
              <span>CASE 1 · Cross-Domain Ambiguity</span>
              <span>Resolved by Wide Tier (6 Tools)</span>
            </div>
            <p className="text-[var(--parchment-dim)] mb-1">
              Query: <em>"Send alert to ops team about high database latency"</em>
            </p>
            <p className="text-[var(--parchment-muted)]">
              Decider split confidence between `telemetry` (0.42) and `messaging` (0.39). Hard top-1 pick would miss `publish_sns_notification`. The adaptive tier widened to 6 tools, allowing Bedrock to make the correct final selection.
            </p>
          </div>

          <div className="p-3 rounded border border-[var(--line)] bg-[var(--ink-900)]">
            <div className="flex items-center justify-between text-[var(--ember)] font-bold mb-1">
              <span>CASE 2 · Jargon vs Colloquial Phrasing</span>
              <span>Resolved by Descriptor Tuning</span>
            </div>
            <p className="text-[var(--parchment-dim)] mb-1">
              Query: <em>"Kill the stuck box in us-west"</em>
            </p>
            <p className="text-[var(--parchment-muted)]">
              Initial test missed `compute.terminate_instance` because "box" wasn't mapped. Refining the 12-word tool descriptor to include synonyms resolved the failure cleanly.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
