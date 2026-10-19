import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* Title */}
      <div className="border-b border-[var(--line)] pb-5">
        <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--brass)]">
          ARCHITECTURAL PATTERN & REUSABILITY
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--parchment)] tracking-wide">
          The Polaris Method
        </h1>
        <p className="text-sm font-body text-[var(--parchment-dim)] max-w-2xl mt-2">
          How to eliminate tool schema bloat in LLM agents using hierarchical Decider 2B routing in front of Amazon Bedrock.
        </p>
      </div>

      {/* 3 Step Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="plate p-5 space-y-2">
          <div className="plate-tag">STEP 1 · GATE</div>
          <h3 className="font-display text-xl font-bold text-[var(--parchment)]">
            Needs Tool & Category
          </h3>
          <p className="text-xs text-[var(--parchment-dim)] leading-relaxed">
            A single POST to Decider 2B (<code>/v1/systemone</code>) evaluates two questions simultaneously:
            a <code>noul</code> question (is an external tool needed?) and a <code>choice</code> question selecting the top category.
          </p>
        </div>

        <div className="plate p-5 space-y-2">
          <div className="plate-tag">STEP 2 · SHORTLIST</div>
          <h3 className="font-display text-xl font-bold text-[var(--parchment)]">
            In-Category Scoring
          </h3>
          <p className="text-xs text-[var(--parchment-dim)] leading-relaxed">
            Decider scores tools only inside the top-2 categories. Final scores are computed via 
            <code>P(category) × P(tool | category)</code>, keeping option context well within 4,096 tokens.
          </p>
        </div>

        <div className="plate p-5 space-y-2">
          <div className="plate-tag">STEP 3 · ADAPT</div>
          <h3 className="font-display text-xl font-bold text-[var(--parchment)]">
            Confidence Tiering
          </h3>
          <p className="text-xs text-[var(--parchment-dim)] leading-relaxed">
            High confidence (≥0.85) sends exactly 1 tool. Lower confidence widens the shortlist to 3 or 6 tools, allowing Amazon Bedrock to make the final determination safely.
          </p>
        </div>

      </div>

      {/* Code Snippet Plate */}
      <div className="plate">
        <div className="plate-header">
          <div className="flex items-center gap-2">
            <span className="plate-tag">REUSABLE PATTERN</span>
            <span className="text-[var(--parchment-muted)] font-mono text-xs">·</span>
            <h2 className="plate-title">5-Line Bedrock Integration</h2>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--brass)] bg-[var(--brass)]/10 text-xs font-mono text-[var(--brass-bright)] hover:bg-[var(--brass)]/20 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--lichen)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
          </button>
        </div>

        <pre className="p-4 rounded bg-[var(--ink-900)] border border-[var(--line)] overflow-x-auto text-xs font-mono text-[var(--parchment)] leading-relaxed">
          <code>{codeSnippet}</code>
        </pre>
      </div>

      {/* Comparison Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded border border-[var(--line)] bg-[var(--ink-800)]/60 space-y-2">
          <div className="text-[10px] font-mono uppercase text-[var(--ember)]">WITHOUT POLARIS</div>
          <h4 className="font-display text-lg font-bold text-[var(--parchment)]">
            Unfiltered 240-Tool Prompts
          </h4>
          <ul className="text-xs text-[var(--parchment-dim)] space-y-1.5 list-disc pl-4 font-mono">
            <li>~38,400 prompt tokens per user request</li>
            <li>3.5 to 5.0 seconds LLM latency</li>
            <li>Risk of context window degradation and hallucinated arguments</li>
            <li>~$0.11 per query Bedrock cost</li>
          </ul>
        </div>

        <div className="p-5 rounded border border-[var(--brass)] bg-[var(--ink-800)]/60 space-y-2">
          <div className="text-[10px] font-mono uppercase text-[var(--brass-bright)]">WITH POLARIS</div>
          <h4 className="font-display text-lg font-bold text-[var(--brass-bright)]">
            Decider 2B Pre-Filtered Router
          </h4>
          <ul className="text-xs text-[var(--parchment-dim)] space-y-1.5 list-disc pl-4 font-mono">
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
