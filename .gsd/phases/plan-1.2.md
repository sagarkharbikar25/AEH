---
phase: 1
plan: 2
wave: 2
gap_closure: false
depends_on: [plan-1.1]
---

# Plan 1.2: Confidence-Adaptive Tiering & Decider Client

## Objective
Implement the core mathematical tiering engine, the Strands Decider 2B HTTP client for two-call hierarchical SystemOne routing, and unit tests verifying score calculation and tier allocation.

## Context
- `.gsd/SPEC.md`
- `packages/router/src/schema.ts`
- `packages/router/src/compileCatalog.ts`

## Tasks

<task type="auto">
  <name>Implement Calibrated Tiering in src/tiers.ts and thresholds.json</name>
  <files>
    packages/router/thresholds.json
    packages/router/src/tiers.ts
  </files>
  <action>
    1. Create thresholds.json defining confidence boundaries:
       - direct: >= 0.85 -> 1 tool
       - narrow: >= 0.55 -> 3 tools
       - wide: >= 0.30 -> 6 tools
       - fallback: < 0.30 -> 12 tools
       - no_tool: needs_tool < 0.20 -> 0 tools
    2. Implement src/tiers.ts exporting:
       - `determineTier(topScore: number, needsToolScore: number): Tier`
       - `combineScores(pCategory: number, pToolGivenCategory: number): number`
       - `rankAndTierShortlist(catalog, categoryScores, inCategoryToolScores, needsToolScore): ShortlistResult`
  </action>
  <verify>
    Verify with math test vectors.
  </verify>
  <done>
    tiers.ts correctly computes scores and assigns tiers.
  </done>
</task>

<task type="auto">
  <name>Implement Decider 2B Client in src/deciderClient.ts</name>
  <files>
    packages/router/src/deciderClient.ts
  </files>
  <action>
    Build the Decider 2B SystemOne HTTP client:
    1. Call 1: Sends state + { needs_tool: noul, category: choice }.
    2. Call 2: Sends state + choice question for top-2 categories.
    3. Handles timeouts, connection errors, and optional simulation mode when Decider 2B server is offline.
  </action>
  <verify>
    Verify client exports and error handling.
  </verify>
  <done>
    deciderClient.ts implements two-call flow with resilience.
  </done>
</task>

<task type="auto">
  <name>Assemble shortlistTools entrypoint and Vitest Unit Tests</name>
  <files>
    packages/router/src/index.ts
    packages/router/src/tiers.test.ts
  </files>
  <action>
    1. Implement main entrypoint `shortlistTools(prompt, catalog, options)` in src/index.ts.
    2. Create unit tests in src/tiers.test.ts covering:
       - Tier determination at boundaries (0.85, 0.55, 0.30, 0.15)
       - Score multiplication math
       - Shortlist size capping
       - No-tool gate bypass
  </action>
  <verify>
    Run tests or verify test file syntax.
  </verify>
  <done>
    Vitest tests written and exported from index.ts.
  </done>
</task>

## Must-Haves
- [ ] Direct tier triggers on >=0.85.
- [ ] Score formula matches `P(category) * P(tool|category)`.
- [ ] Two-call hierarchical flow implemented.

## Success Criteria
- [ ] All 3 tasks committed atomically.
- [ ] SUMMARY-1.2.md generated.
