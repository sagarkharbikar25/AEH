# Plan 1.2 Summary: Confidence-Adaptive Tiering & Decider Client

> **Phase:** 1 (Reusable Router Package)  
> **Plan:** 1.2  
> **Wave:** 2  
> **Status:** COMPLETED  
> **Branch:** `backend`

---

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| **1.2.1** | Implement Calibrated Tiering in src/tiers.ts and thresholds.json | `45a3ee3` | `packages/router/thresholds.json`, `packages/router/src/tiers.ts` |
| **1.2.2** | Implement Decider 2B Client in src/deciderClient.ts | `0e8ea2d` | `packages/router/src/deciderClient.ts` |
| **1.2.3** | Assemble shortlistTools Entrypoint & Vitest Unit Tests | `59b50eb` | `packages/router/src/index.ts`, `packages/router/src/tiers.test.ts` |

---

## Key Achievements & Deliverables

1. **Confidence-Adaptive Tiering (`thresholds.json`, `tiers.ts`)**:
   - `direct` (≥0.85): Exactly 1 tool sent directly to Amazon Bedrock.
   - `narrow` (0.55–0.85): 3 tools sent to Amazon Bedrock.
   - `wide` (0.30–0.55): 6 tools sent to Amazon Bedrock.
   - `fallback` (<0.30): 12 tools sent with clarification.
   - `no_tool` (<0.25 on gate): 0 tools sent, allowing direct conversational LLM response.

2. **Decider 2B Hierarchical Client (`deciderClient.ts`)**:
   - Implements two-call flow against `POST /v1/systemone`:
     - Call 1: `needs_tool` (`noul`) + `category` (`choice`).
     - Call 2: In-category `choice` for top-2 categories.
   - Evaluates composite probability: `P(tool) = P(category) × P(tool | category)`.
   - Incorporates offline heuristic simulation fallback for reliable local development and CI testing.

3. **Core Entrypoint & Comprehensive Unit Tests (`index.ts`, `tiers.test.ts`)**:
   - Clean async `shortlistTools(prompt, catalog, options)` API.
   - Unit tests covering boundary values, score multiplication math, Bedrock double-underscore formatting, and catalog compilation.

---

## Next Plan in Wave 3:
- **Plan 1.3**: Reusable Pattern Documentation (`PATTERN.md`) & Bedrock Converse Example (`examples/bedrock-converse.ts`).
