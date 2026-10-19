---
phase: 5
plan: 1
wave: 1
gap_closure: false
depends_on: [plan-4.2]
---

# Plan 5.1: Benchmark Evaluation Suite

## Objective
Establish the reproducible evaluation harness in `bench/`: create an evaluation dataset (`bench/queries.json`), benchmark evaluation runner (`bench/run.ts`), and generate ground-truth validation output (`bench/results.json`) reproducing the Pareto frontier, latency distributions (p50/p90/p99), Recall@k rates, and failure audit for `/almanac`.

## Context
- `packages/router/src/index.ts`
- `server/src/tools/catalog.json`
- `server/src/agent/pricing.ts`
- `web/src/pages/Almanac.tsx`
- `plan/final-plan.md`

## Tasks

<task type="auto">
  <name>Create Evaluation Dataset in bench/queries.json</name>
  <files>
    bench/queries.json
  </files>
  <action>
    Construct test benchmark dataset of representative queries across all 12 categories:
    - Direct single-intent queries (e.g. "Create calendar invite for tomorrow at 3pm")
    - Ambiguous multi-system queries (e.g. "Payment failure rate spiked 12% in EU region")
    - Negative/Out-of-domain queries (e.g. "Explain Amdahl's Law in parallel computing")
    - Multi-intent chained queries (e.g. "Query DB connection pool and alert Slack if over 90%")
    Each query record contains: `id`, `query`, `expectedCategory`, `expectedToolId`, `tier`, `difficulty`.
  </action>
  <verify>
    Verify JSON valid array with representative distribution across all 12 constellations.
  </verify>
  <done>
    bench/queries.json populated with calibrated test queries.
  </done>
</task>

<task type="auto">
  <name>Implement Benchmark Runner in bench/run.ts</name>
  <files>
    bench/run.ts
    bench/package.json
    bench/tsconfig.json
  </files>
  <action>
    Implement benchmark runner:
    1. Evaluates Polaris Hierarchical Router (`@polaris/router`) vs Flat Decider vs Full Bedrock baseline.
    2. Measures:
       - Recall@1, Recall@3, Recall@5
       - Latency distributions: p50, p90, p99
       - Token reduction & dollar savings
    3. Exports structured results into `bench/results.json` matching the Almanac data schema.
  </action>
  <verify>
    Run `npm run bench` and verify `bench/results.json` generation.
  </verify>
  <done>
    bench/run.ts executes successfully and outputs empirical validation data.
  </done>
</task>

## Must-Haves
- [ ] Evaluation dataset with diverse query archetypes.
- [ ] Empirical Recall@k and latency percentiles calculation.
- [ ] Generation of `bench/results.json`.

## Success Criteria
- [ ] Plan committed with `feat(5-1): implement benchmark evaluation harness and export results`.
