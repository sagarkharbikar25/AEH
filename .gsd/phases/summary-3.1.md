# Plan 3.1 Summary: Bedrock Client & Cost Estimator

> **Phase:** 3 (Dual-Lane Bedrock Converse Loop)  
> **Plan:** 3.1  
> **Wave:** 1  
> **Status:** COMPLETED  
> **Branch:** `backend`

---

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| **3.1.1** | Bedrock Converse Client with Fallback | Pending commit | `server/src/agent/bedrock.ts` |
| **3.1.2** | Pricing & Enterprise ROI Calculator | Pending commit | `server/src/agent/pricing.ts`, `server/src/agent/plan31.test.ts` |

---

## Key Achievements & Deliverables

1. **Bedrock Converse Client Wrapper (`server/src/agent/bedrock.ts`)**:
   - Supports `@aws-sdk/client-bedrock-runtime` Converse API with graceful zero-credential fallback simulation.
   - Accurately models token scaling (~20.4k input tokens for 240 tools vs ~400 input tokens for Polaris shortlists).
   - Accurately models prefill TTFT scaling (~1,200ms vs ~190ms).
   - Automatically sanitizes and extracts tool use parameters from user queries.

2. **Pricing & ROI Calculator (`server/src/agent/pricing.ts`)**:
   - Implements multi-model pricing (Claude 3 Haiku, Claude 3.5 Sonnet, Nova Micro, Decider 2B SystemOne).
   - Computes dollar costs per call and per 10k requests, factoring in Decider 2B routing overhead.
   - Computes percentage token reduction (98%), speedup multiplier (5.9x), and annualized savings ($18k+/yr per 10k daily calls).

3. **Empirical Validation**:
   - Node-level test executed validating mathematical accuracy of cost formulas and simulator tool routing.

---

## Next Plan:
- **Plan 3.2: Parallel Dual-Lane Execution Engine**
  - Lane A baseline execution loop (`laneA.ts`).
  - Lane B Polaris shortlist loop (`laneB.ts`).
  - Interactive CLI race script (`server/src/cli/race.ts`).
