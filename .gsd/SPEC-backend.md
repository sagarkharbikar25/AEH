---
status: FINALIZED
updated: 2026-10-19
branch: backend
project: POLARIS (AWS Strands Decider Agent Hackathon)
pattern: Tool Selection (#strands-decider-2b #tool-selection)
---

# POLARIS: Backend Specification

## 1. Overview
The backend service for POLARIS implements a high-throughput, low-latency intelligent tool router placing Strands Decider 2B in front of Amazon Bedrock Converse. It enables AI agents to select precisely 1 to 6 tools from a 240-tool catalog in ~40ms, slashing 96.8% of input prompt tokens and 80% of roundtrip Bedrock latency.

## 2. Requirements

### 2.1 Reusable Router Package (`packages/router`)
1. **Catalog Compiler**: Pre-clusters 240 tools into 12 constellations with 12-word descriptors.
2. **Hierarchical SystemOne Calling**:
   - Call 1: Evaluates `needs_tool` (`noul`) + `category` (`choice`).
   - Call 2: Evaluates `tool` (`choice`) inside top-2 categories.
   - Score: `P(category) × P(tool | category)`.
3. **Confidence-Adaptive Tiering**:
   - `direct` (≥0.85): Exactly 1 tool sent to Bedrock.
   - `narrow` (0.55–0.85): 3 tools sent to Bedrock.
   - `wide` (0.30–0.55): 6 tools sent to Bedrock.
   - `fallback` (<0.30): 12 tools + `ask_clarification`.
   - `no_tool` (score < 0.20): 0 tools.
4. **Community Pattern**:
   - `PATTERN.md` documentation explaining the reusable architecture.
   - 5-line drop-in snippet for Amazon Bedrock Converse.

### 2.2 Simulated Tool Executor (`server/src/tools`)
1. **Catalog Seed**: 240 mock tool definitions across 12 constellations.
2. **Safe Sandbox Execution**: Realistic JSON outputs, zero external network side-effects or destructive operations.

### 2.3 Dual-Lane Bedrock Converse Loop (`server/src/agent`)
1. **Lane A (Baseline)**: Formats all 240 schemas into Bedrock Converse `toolConfig`. Measures tokens, latency, and tool choice.
2. **Lane B (Polaris)**: Passes only shortlisted 1-6 tools into Bedrock Converse.
3. **Local Dev Resiliency**: Uses real Bedrock when AWS credentials exist; provides calibrated fallback simulation if running offline.

### 2.4 Express API & Real-Time SSE Streaming (`server/src`)
1. **Endpoints**:
   - `GET /api/health`: Status of Express, Decider 2B, and Bedrock.
   - `GET /api/catalog`: 240 tools with coordinates.
   - `POST /api/route`: Standalone routing endpoint.
   - `POST /api/race`: Initiates race run, returns `runId`.
   - `GET /api/race/:id/stream`: SSE live telemetry events (`decision`, `shortlist`, `lane_start`, `lane_tokens`, `lane_done`, `final`, `error`).
   - `GET /api/runs/:id`: Replay finished race.
2. **Safety Middleware**:
   - UUID `x-request-id` tracing.
   - Standard error envelope (`{ error: { code, message, requestId } }`).
   - Per-IP rate limiting and daily spend kill switch (`BUDGET_EXHAUSTED`).
   - CORS locked to Vercel and local dev origins.

### 2.5 Benchmark Harness (`bench/`)
1. Evaluates 400 test queries across recall@1, recall@3, recall@6, and latency.
2. Generates calibration table and honest failure audit dataset for `/almanac`.

## 3. Success Criteria
- [ ] `packages/router` builds with strict TypeScript and zero type errors.
- [ ] Unit tests in `packages/router` pass 100%.
- [ ] Express API starts, serves `/api/health` and `/api/catalog`.
- [ ] `/api/race/:id/stream` streams live dual-lane race events with zero buffering.
- [ ] Atomic commits for each plan using `feat(backend): ...` or `fix(backend): ...`.
