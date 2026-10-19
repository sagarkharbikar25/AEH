---
phase: 3
plan: 2
wave: 2
gap_closure: false
depends_on: [plan-3.1]
---

# Plan 3.2: Parallel Dual-Lane Execution Engine

## Objective
Implement `server/src/agent/laneA.ts` (Baseline with all 240 tools) and `server/src/agent/laneB.ts` (Polaris hierarchical router with 1-6 tools), plus the interactive CLI runner `server/src/cli/race.ts` that runs both lanes concurrently and displays real-time execution telemetry, token savings, and speedup ratios.

## Context
- `packages/router/src/index.ts`
- `packages/router/src/compileCatalog.ts`
- `server/src/tools/catalog.json`
- `server/src/tools/executor.ts`
- `server/src/agent/bedrock.ts`
- `server/src/agent/pricing.ts`

## Tasks

<task type="auto">
  <name>Implement Lane A (240 Tools Baseline)</name>
  <files>
    server/src/agent/laneA.ts
  </files>
  <action>
    Implement Lane A runner:
    1. Loads all 240 tools from `catalog.json`.
    2. Compiles to Bedrock toolConfig via `compileBedrockToolConfig(catalog)`.
    3. Calls Bedrock Converse with all 240 tool specifications.
    4. Extracts toolUse and executes via `executeSimulatedTool`.
    5. Measures detailed stage latencies: `schema_compilation`, `bedrock_converse`, `tool_execution`.
    6. Returns structured `LaneAResult`.
  </action>
  <verify>
    Execute Lane A with test prompt and check returned token usage (~20.4k input tokens) and tool execution.
  </verify>
  <done>
    laneA.ts completes end-to-end tool selection and execution against full catalog.
  </done>
</task>

<task type="auto">
  <name>Implement Lane B (Polaris Hierarchical Shortlist)</name>
  <files>
    server/src/agent/laneB.ts
  </files>
  <action>
    Implement Lane B runner:
    1. Calls `@polaris/router` `shortlistTools(query, catalog)`.
    2. Receives tier ('direct' | 'narrow' | 'wide' | 'fallback' | 'no_tool') and 1-6 candidate tools.
    3. Compiles Bedrock toolConfig with ONLY the shortlisted candidates.
    4. Calls Bedrock Converse with lightweight toolConfig (~350-550 tokens).
    5. Extracts toolUse and executes via `executeSimulatedTool`.
    6. Measures detailed stage latencies: `decider_cat`, `decider_tool`, `bedrock_converse`, `tool_execution`.
    7. Returns structured `LaneBResult`.
  </action>
  <verify>
    Execute Lane B with test prompt and verify input tokens are <= 600 with matching tool selected.
  </verify>
  <done>
    laneB.ts achieves >90% token savings while selecting the correct tool.
  </done>
</task>

<task type="auto">
  <name>Build Interactive CLI Race Harness</name>
  <files>
    server/src/cli/race.ts
  </files>
  <action>
    Create CLI executable:
    1. Accepts user query as argument or defaults to "Schedule a sync meeting with the platform team tomorrow at 2pm".
    2. Runs Lane A and Lane B in parallel via `Promise.all`.
    3. Computes comparative metrics via `calculateSavings`.
    4. Renders a clean terminal dashboard showing:
       - Selected tools (Lane A vs Lane B)
       - Token usage (Lane A ~20,400 vs Lane B ~410)
       - Latency & TTFT speedup
       - Cost per 10k requests & annual savings projection.
  </action>
  <verify>
    Run `node --experimental-strip-types server/src/cli/race.ts` and inspect console output.
  </verify>
  <done>
    server/src/cli/race.ts runs without error and clearly highlights Polaris superiority.
  </done>
</task>

## Must-Haves
- [ ] Lane A passes all 240 tools to Bedrock.
- [ ] Lane B uses `@polaris/router` to filter down to 1-6 tools before calling Bedrock.
- [ ] Both lanes invoke `executeSimulatedTool` and return identical tool semantics.
- [ ] CLI race script runs cleanly in terminal.

## Success Criteria
- [ ] All 3 tasks committed with `feat(3-2): implement parallel dual-lane execution engine and cli race harness`.
