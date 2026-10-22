import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { BorderBeamFrame } from '../components/BorderBeamFrame';

export const MethodPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const codeSnippet = `import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { compileCatalog, shortlistTools } from "@polaris/router";

// 1. Compile 240 tools once (with 12-word descriptors)
const catalog = compileCatalog(rawTools);

// 2. Polaris narrows 240 tools to 1-6 in ~40ms
const { tools: shortlisted, tier } = await shortlistTools(userPrompt, catalog, {
  deciderUrl: "http://localhost:8000"
});

// 3. Amazon Bedrock Converse receives ONLY the shortlisted tools
const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const response = await bedrock.send(new ConverseCommand({
  modelId: "anthropic.claude-3-haiku-20240307-v1:0",
  messages: [{ role: "user", content: [{ text: userPrompt }] }],
  toolConfig: { tools: shortlisted }
}));`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      
      {/* Title */}
      <div className="border-b border-[#E0FFC2]/15 pb-6">
        <div className="text-[10px] font-mono tracking-widest uppercase text-[#E0FFC2] font-bold mb-1">
          ARCHITECTURAL PATTERN & REUSABILITY
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#F2FDF0] tracking-wide">
          The Polaris Method
        </h1>
        <p className="text-sm font-body text-[#C2E2BE] max-w-2xl mt-2 leading-relaxed">
          How to eliminate tool schema bloat in LLM agents using hierarchical Decider 2B routing in front of Amazon Bedrock.
        </p>
      </div>

      {/* 3 Step Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <BorderBeamFrame activeBeam={false}>
          <div className="text-[10px] font-mono text-[#E0FFC2] uppercase font-bold tracking-widest mb-1.5">
            STEP 1 · GATE
          </div>
          <h3 className="font-display text-xl font-bold text-[#F2FDF0] mb-2">
            Needs Tool & Category
          </h3>
          <p className="text-xs text-[#C2E2BE] leading-relaxed font-body">
            A single POST to Decider 2B (<code>/v1/systemone</code>) evaluates two questions simultaneously:
            a <code>noul</code> question (is an external tool needed?) and a <code>choice</code> question selecting the top category.
          </p>
        </BorderBeamFrame>

        <BorderBeamFrame activeBeam={false}>
          <div className="text-[10px] font-mono text-[#E0FFC2] uppercase font-bold tracking-widest mb-1.5">
            STEP 2 · SHORTLIST
          </div>
          <h3 className="font-display text-xl font-bold text-[#F2FDF0] mb-2">
            In-Category Scoring
          </h3>
          <p className="text-xs text-[#C2E2BE] leading-relaxed font-body">
            Decider scores tools only inside the top-2 categories. Final scores are computed via 
            <code>P(category) × P(tool | category)</code>, keeping option context well within 4,096 tokens.
          </p>
        </BorderBeamFrame>

        <BorderBeamFrame activeBeam={false}>
          <div className="text-[10px] font-mono text-[#E0FFC2] uppercase font-bold tracking-widest mb-1.5">
            STEP 3 · ADAPT
          </div>
          <h3 className="font-display text-xl font-bold text-[#F2FDF0] mb-2">
            Confidence Tiering
          </h3>
          <p className="text-xs text-[#C2E2BE] leading-relaxed font-body">
            High confidence (≥0.85) sends exactly 1 tool. Lower confidence widens the shortlist to 3 or 6 tools, allowing Amazon Bedrock to make the final determination safely.
          </p>
        </BorderBeamFrame>

      </div>

      {/* Code Snippet Plate with Border Beam */}
      <BorderBeamFrame activeBeam={true}>
        <div className="flex items-center justify-between border-b border-[#E0FFC2]/15 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#E0FFC2]" />
            <h2 className="font-display text-xl font-bold text-[#F2FDF0]">
              5-Line Bedrock Integration Snippet
            </h2>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E0FFC2]/50 bg-[#064734]/50 text-xs font-mono text-[#E0FFC2] hover:bg-[#064734]/80 transition-all shadow-[0_0_12px_rgba(224,255,194,0.18)]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#E0FFC2]" />}
            <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-lg bg-[#02120e] border border-[#E0FFC2]/15 overflow-x-auto text-xs font-mono text-[#E0F5DD] leading-relaxed">
          <code>{codeSnippet}</code>
        </pre>
      </BorderBeamFrame>

      {/* Comparison Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-white/10 bg-[#02040A] space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">WITHOUT POLARIS</div>
          <h4 className="font-display text-lg font-bold text-slate-100">
            Unfiltered 240-Tool Prompts
          </h4>
          <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-mono leading-relaxed">
            <li>~38,400 prompt tokens per user request</li>
            <li>3.5 to 5.0 seconds LLM latency</li>
            <li>Risk of context window degradation and hallucinated parameters</li>
            <li>~$0.11 per query Bedrock cost</li>
          </ul>
        </div>

        <div className="p-6 rounded-xl border border-amber-400/40 bg-[#050A15] space-y-2.5 shadow-[0_0_20px_rgba(245,208,97,0.08)]">
          <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">WITH POLARIS</div>
          <h4 className="font-display text-lg font-bold text-amber-300">
            Decider 2B Pre-Filtered Router
          </h4>
          <ul className="text-xs text-slate-200 space-y-2 list-disc pl-4 font-mono leading-relaxed">
            <li>~1,100 prompt tokens per user request (97% savings)</li>
            <li>~400 ms total turnaround</li>
            <li>Bedrock focuses exclusively on exact parameter filling</li>
            <li>~$0.003 per query Bedrock cost</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
