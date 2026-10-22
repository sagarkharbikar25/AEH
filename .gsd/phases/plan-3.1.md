---
phase: 3
plan: 1
wave: 1
gap_closure: false
depends_on: [plan-2.1]
---

# Plan 3.1: Bedrock Client & Cost Estimator

## Objective
Implement `server/src/agent/bedrock.ts` providing an interface to AWS Bedrock Converse (`@aws-sdk/client-bedrock-runtime` using `anthropic.claude-3-haiku-20240307-v1:0` or Nova micro/lite) with a transparent local simulation fallback for zero-credential testing. Implement `server/src/agent/pricing.ts` computing prompt tokens, completion tokens, TTFT, and financial dollar savings per 10k requests.

## Context
- `packages/router/src/schema.ts`
- `packages/router/src/compileCatalog.ts`
- `server/src/tools/catalog.json`
- `server/src/tools/executor.ts`

## Tasks

<task type="auto">
  <name>Implement Bedrock Converse Client with Dev Fallback</name>
  <files>
    server/src/agent/bedrock.ts
  </files>
  <action>
    Create Bedrock Converse client wrapper:
    1. Import `BedrockRuntimeClient`, `ConverseCommand` from `@aws-sdk/client-bedrock-runtime`.
    2. Check for AWS credentials or `BEDROCK_MOCK=true`.
    3. If active AWS credentials exist and `BEDROCK_MOCK !== 'true'`, invoke `ConverseCommand` against target model (default `anthropic.claude-3-haiku-20240307-v1:0`).
    4. If credentials missing or in mock mode, execute simulated Converse call that:
       - Measures simulated latency (Lane A with 240 tools takes ~1,100ms - 1,400ms TTFT; Lane B with 1-6 tools takes ~180ms - 240ms TTFT).
       - Selects the optimal matching tool from the provided `toolConfig.tools` list based on the prompt.
       - Returns realistic `toolUse` block with arguments, usage statistics (`inputTokens`, `outputTokens`, `totalTokens`), and stopReason `'tool_use'`.
  </action>
  <verify>
    Run node verification script testing mock converse calls with shortlists vs 240 tools.
  </verify>
  <done>
    server/src/agent/bedrock.ts reliably returns tool selections and realistic token counts under both live and mock conditions.
  </done>
</task>

<task type="auto">
  <name>Implement Pricing and ROI Calculator</name>
  <files>
    server/src/agent/pricing.ts
  </files>
  <action>
    Implement pricing models and token economics:
    1. Define pricing constants for Bedrock models (e.g. Claude 3 Haiku: $0.25 / 1M input tokens, $1.25 / 1M output tokens; Nova Micro: $0.035 / 1M input, $0.14 / 1M output; Decider 2B: $0.05 / 1M tokens).
    2. Define `calculateCost(modelId, inputTokens, outputTokens): number`.
    3. Define `calculateSavings(laneAStats, laneBStats, requestVolume = 10000): SavingsComparison`.
    4. Provide dollar savings, percentage token reduction, latency speedup ratio, and annualized enterprise projection.
  </action>
  <verify>
    Verify calculations match specification in SPEC.md (approx 91-96% token reduction and 6-8x TTFT speedup).
  </verify>
  <done>
    pricing.ts outputs exact dollar calculations and savings analytics.
  </done>
</task>

## Must-Haves
- [ ] Safe simulation fallback when AWS credentials are not set.
- [ ] Support both 240-tool full catalog and Polaris filtered shortlists.
- [ ] Transparent token counting and cost computation.

## Success Criteria
- [ ] Plan committed with `feat(3-1): implement bedrock converse client and pricing engine`.
