# POLARIS: Backend Roadmap

> **Branch:** `backend`  
> **Status:** ACTIVE  
> **Approach:** Strict GSD Wave Execution (Atomic Commits, Empirical Validation)

---

## Phase 1: Reusable Router Package (`packages/router`)
*The standalone NPM package providing drop-in Decider 2B hierarchical routing.*

- [ ] **Plan 1.1: Core Types, Zod Schemas & Catalog Compiler** (Wave 1)
  - Tasks:
    - 1.1.1: Initialize `packages/router/package.json` & `tsconfig.json` with strict typing.
    - 1.1.2: Define Zod schemas in `src/schema.ts` for Decider requests/responses.
    - 1.1.3: Implement `src/compileCatalog.ts` clustering 240 tools into 12 constellations.
- [ ] **Plan 1.2: Confidence-Adaptive Tiering & Decider Client** (Wave 2)
  - Tasks:
    - 1.2.1: Implement `src/tiers.ts` with calibrated thresholds (`thresholds.json`).
    - 1.2.2: Implement `src/deciderClient.ts` calling Decider 2B `POST /v1/systemone`.
    - 1.2.3: Assemble `src/index.ts` with `shortlistTools()` entrypoint and Vitest unit tests.
- [ ] **Plan 1.3: Reusable Pattern Docs & Bedrock Converse Example** (Wave 3)
  - Tasks:
    - 1.3.1: Write `packages/router/PATTERN.md` explaining the two-call hierarchical pattern.
    - 1.3.2: Create `packages/router/examples/bedrock-converse.ts` (5-line drop-in snippet).

---

## Phase 2: Mock Tool Catalog & Simulated Executor (`server/src/tools`)
*Safe, sandboxed execution of 240 tools returning realistic payloads.*

- [ ] **Plan 2.1: Tool Catalog Seed & Execution Harness** (Wave 1)
  - Tasks:
    - 2.1.1: Export 240 mock tool definitions in `server/src/tools/catalog.json`.
    - 2.1.2: Implement safe simulator in `server/src/tools/executor.ts` with realistic JSON payloads.

---

## Phase 3: Dual-Lane Bedrock Converse Loop (`server/src/agent`)
*Parallel race execution: Lane A (240 tools) vs Lane B (Polaris 1-6 tools).*

- [ ] **Plan 3.1: Bedrock Client & Cost Estimator** (Wave 1)
  - Tasks:
    - 3.1.1: Configure `@aws-sdk/client-bedrock-runtime` with fallback dev simulator.
    - 3.1.2: Implement pricing utility calculating dollar savings per 10k requests.
- [ ] **Plan 3.2: Parallel Dual-Lane Execution Engine** (Wave 2)
  - Tasks:
    - 3.2.1: Build `server/src/agent/laneA.ts` (All 240 tools baseline).
    - 3.2.2: Build `server/src/agent/laneB.ts` (Polaris shortlist).
    - 3.2.3: Build CLI race script `server/src/cli/race.ts` for quick terminal testing.

---

## Phase 4: Express API & Real-Time SSE Streaming (`server/src`)
*Express API broadcasting live telemetry events via Server-Sent Events.*

- [ ] **Plan 4.1: Express Server & Safety Middleware** (Wave 1)
  - Tasks:
    - 4.1.1: Scaffold Express server (`server/src/index.ts`, `server/src/app.ts`).
    - 4.1.2: Implement `server/src/middleware/safety.ts`: request-id, error envelope, rate limit, and spend kill-switch.
- [ ] **Plan 4.2: Endpoints & SSE Streaming Engine** (Wave 2)
  - Tasks:
    - 4.2.1: Implement `GET /api/health`, `GET /api/catalog`, and `POST /api/route`.
    - 4.2.2: Implement `POST /api/race` and `GET /api/race/:id/stream` SSE live event bus.

---

## Phase 5: Benchmark Evaluation Harness (`bench/`)
*Measures and generates the empirical Pareto frontier and failure audit.*

- [ ] **Plan 5.1: Benchmark Evaluation Suite** (Wave 1)
  - Tasks:
    - 5.1.1: Create test queries dataset in `bench/queries.json`.
    - 5.1.2: Implement evaluation runner in `bench/run.ts` recording recall@k and latency.
    - 5.1.3: Export results in `bench/results.json` matching `/almanac` tables.
