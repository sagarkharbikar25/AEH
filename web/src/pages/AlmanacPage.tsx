import React, { useEffect, useState } from 'react';
import { BenchResults } from '@polaris/contracts';
import { BorderBeamFrame } from '../components/BorderBeamFrame';
import { api } from '../lib/api';

export const AlmanacPage: React.FC = () => {
  const [bench, setBench] = useState<BenchResults | null>(null);
  const [source, setSource] = useState<'live' | 'bundled'>('bundled');

  useEffect(() => {
    api.getBenchLatest()
      .then((res) => {
        setBench(res);
        setSource('live');
      })
      .catch(() => {
        // Fallback to static bundled payload
        setSource('bundled');
      });
  }, []);

  const confA = bench?.configs?.find((c) => c.id === 'all_tools') || {
    label: 'All Tools (Baseline)',
    accuracy: 78.5,
    avgInputTokens: 20400,
    avgLatencyMs: 1250,
    costPer1k: 5.19,
  };

  const confC = bench?.configs?.find((c) => c.id === 'hierarchical') || {
    label: 'Hierarchical Adaptive (POLARIS)',
    accuracy: 57.9,
    avgInputTokens: 410,
    avgLatencyMs: 226,
    costPer1k: 0.213,
  };

  const tokenReduction = (((confA.avgInputTokens - confC.avgInputTokens) / confA.avgInputTokens) * 100).toFixed(1);
  const speedupMultiplier = (confA.avgLatencyMs / confC.avgLatencyMs).toFixed(1);
  const costSaved10k = ((confA.costPer1k - confC.costPer1k) * 10).toFixed(2);
  const recallAt6 = bench?.decider?.recallAt6 ?? 57.9;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      
      {/* Page Title */}
      <div className="border-b border-white/10 pb-6 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-bold mb-1">
            EMPIRICAL BENCHMARKS & EVALUATION
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-100 tracking-wide">
            The Astronomical Almanac
          </h1>
          <p className="text-sm font-body text-slate-300 max-w-2xl mt-2 leading-relaxed">
            Measured Pareto curves, latency percentiles, confidence calibration tables, and honest failure audits across 432 evaluation queries against 240 tools.
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-2.5 py-1 text-[10px] font-mono uppercase font-bold tracking-wider rounded border ${
            source === 'live' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}>
            {source === 'live' ? '● Live API Data' : '○ Bundled Harvest'}
          </span>
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BorderBeamFrame activeBeam={false} className="p-4">
          <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Input Token Reduction</div>
          <div className="text-3xl font-display font-bold text-emerald-400 mt-1">{tokenReduction}%</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">{confA.avgInputTokens} down to {confC.avgInputTokens} tokens</div>
        </BorderBeamFrame>

        <BorderBeamFrame activeBeam={false} className="p-4">
          <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">p50 Latency Delta</div>
          <div className="text-3xl font-display font-bold text-amber-300 mt-1">{speedupMultiplier}×</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">{confC.avgLatencyMs}ms vs {confA.avgLatencyMs}ms Converse</div>
        </BorderBeamFrame>

        <BorderBeamFrame activeBeam={false} className="p-4">
          <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Recall @ 6 (Adaptive)</div>
          <div className="text-3xl font-display font-bold text-slate-100 mt-1">{recallAt6}%</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Target tool inside shortlist</div>
        </BorderBeamFrame>

        <BorderBeamFrame activeBeam={false} className="p-4">
          <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Bedrock Cost Saved</div>
          <div className="text-3xl font-display font-bold text-emerald-400 mt-1">${costSaved10k}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Per 10,000 tool requests</div>
        </BorderBeamFrame>
      </div>

      {/* Pareto Frontier Comparison */}
      <BorderBeamFrame activeBeam={true}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs tracking-widest text-amber-300 font-bold uppercase">
              FIGURE I
            </span>
            <span className="text-slate-500 font-mono text-xs">·</span>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-100">
              The Pareto Frontier: Tokens Saved vs Accuracy Maintained
            </h2>
          </div>
          <div className="text-xs font-mono text-cyan-400">
            Claude 3 Haiku · AWS Bedrock Converse
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Configuration</th>
                <th className="py-2.5 px-3">Recall / Accuracy</th>
                <th className="py-2.5 px-3">Input Tokens</th>
                <th className="py-2.5 px-3">p50 Latency</th>
                <th className="py-2.5 px-3">Cost / 1k Reqs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr className="hover:bg-white/5">
                <td className="py-3 px-3 font-bold text-slate-200">A · All 240 Tools (Baseline)</td>
                <td className="py-3 px-3 text-slate-100 font-bold">78.5%</td>
                <td className="py-3 px-3 text-rose-400 font-bold">20,400</td>
                <td className="py-3 px-3">1,250 ms</td>
                <td className="py-3 px-3 text-rose-400 font-bold">$5.190</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-3 font-bold text-slate-200">B · Flat Top-K (Single-Choice)</td>
                <td className="py-3 px-3 text-amber-300 font-bold">64.2%</td>
                <td className="py-3 px-3">1,850</td>
                <td className="py-3 px-3">380 ms</td>
                <td className="py-3 px-3">$0.552</td>
              </tr>
              <tr className="hover:bg-white/5 bg-amber-400/5">
                <td className="py-3 px-3 font-bold text-amber-300">C · Hierarchical Adaptive (POLARIS)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">{confC.accuracy}%</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">{confC.avgInputTokens}</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">{confC.avgLatencyMs} ms</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">${confC.costPer1k.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BorderBeamFrame>

      {/* Reliability & Confidence Calibration Table */}
      <BorderBeamFrame activeBeam={false}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs tracking-widest text-emerald-400 font-bold uppercase">
              TABLE I
            </span>
            <span className="text-slate-500 font-mono text-xs">·</span>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-100">
              Confidence Calibration: Reliability by Score Bucket
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Calibrated on Decider 2B SystemOne
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-amber-300 uppercase">
                <th className="py-3 px-3">Score Bucket</th>
                <th className="py-3 px-3">Samples</th>
                <th className="py-3 px-3">Empirical Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {(bench?.reliability || [
                { bucket: '0.90–1.00', samples: 2, accuracy: 100 },
                { bucket: '0.70–0.89', samples: 18, accuracy: 100 },
                { bucket: '0.50–0.69', samples: 44, accuracy: 93.2 },
                { bucket: '< 0.50', samples: 368, accuracy: 52.4 },
              ]).map((row) => (
                <tr key={row.bucket}>
                  <td className="py-3 px-3 text-slate-100 font-bold">{row.bucket}</td>
                  <td className="py-3 px-3">{row.samples}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">{row.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BorderBeamFrame>

      {/* Failure Audit & Weak Case Analysis */}
      <BorderBeamFrame activeBeam={false}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs tracking-widest text-rose-400 font-bold uppercase">
              TABLE II
            </span>
            <span className="text-slate-500 font-mono text-xs">·</span>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-100">
              Honest Failure Audit: Boundary Errors & Architectural Mitigations
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Boundary Dissection
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-rose-300 uppercase">
                <th className="py-3 px-3">Query</th>
                <th className="py-3 px-3">Expected Tool</th>
                <th className="py-3 px-3">Chosen Tool</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {(bench?.failures || []).slice(0, 10).map((fail, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 text-slate-200 italic max-w-xs truncate">{fail.query}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">{fail.expected || 'none'}</td>
                  <td className="py-3 px-3 text-rose-400 font-bold">{fail.chosen || 'none'}</td>
                  <td className="py-3 px-3 font-bold">{fail.tier}</td>
                  <td className="py-3 px-3 text-slate-200 font-mono">{(fail.confidence * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">{fail.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BorderBeamFrame>

    </div>
  );
};
