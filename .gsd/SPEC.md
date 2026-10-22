---
status: FINALIZED
updated: 2026-10-21
project: POLARIS
hackathon: AWS Strands Decider Agent Hackathon
pattern: Tool Selection
tags: "#strands-decider-2b #tool-selection"
license: Apache-2.0
---

# POLARIS: master specification

## 1. Problem

An agent with 240 tools pays for the whole catalog on every request: tens of thousands of
input tokens, seconds of latency, and mis-calls when the list is long.

POLARIS puts **Strands Decider 2B** in front of Amazon Bedrock Converse. One fast local
decision narrows 240 tools to the 1–6 the request needs. The shortlist size is set by
Decider's calibrated confidence. Bedrock only ever sees the shortlisted tools.

**Honest framing.** The claim to prove is *similar accuracy at far lower tokens and latency*,
not "the LLM fails at tool selection". No accuracy gain is claimed unless measured. Decider is
experimental, so the design uses a forgiving top-k shortlist rather than a hard gate.

## 2. Requirements

### 2.1 Contract (`main`)
1. `packages/contracts` exports zod schemas and inferred types for: SSE race events, the error
   envelope, catalog and shortlist shapes, and the API request/response bodies.
2. `supabase/migrations/0001_init.sql` defines the seven tables of the data plan.
3. `docs/api.md` documents every route.
4. `docs/adr/` holds the four design decisions.
5. `.github/workflows/ci.yml` runs lint, typecheck, test and build.
6. Apache-2.0 `LICENSE`, root `README.md`, `.env.example` with every variable and no secrets.

### 2.2 Reusable router (`packages/router`, owned by `backend`)
1. `compileCatalog(tools)` clusters tools into categories with ≤12-word descriptors.
2. `shortlistTools(query, catalog, opts)` runs the two-call Decider flow and returns
   `{ needsTool, tier, tools, decisions }`.
3. Two calls: call 1 asks `needs_tool` (`noul`) and `category` (`choice`); call 2 asks a
   `tool` (`choice`) question per top-2 category.
4. Score is `P(category) × P(tool | category)`; thresholds load from `thresholds.json`.
5. Tiers: `direct` ≥0.85 → 1 tool; `narrow` 0.55–0.85 → 3; `wide` 0.30–0.55 → 6;
   `fallback` <0.30 → 12 plus `ask_clarification`; `needs_tool = no` → 0.
6. `PATTERN.md` carries the exact request bodies, the wiring, a curl recipe, tuning guidance,
   the 4 096-token limit and the known failure modes.

### 2.3 Agent and API (`server`, owned by `backend`)
1. Lane A sends all 240 tool schemas; Lane B sends only the shortlist; both run in parallel.
2. Token counts and latency come from the Bedrock response metadata.
3. Routes: `GET /api/health`, `GET /api/catalog`, `POST /api/race`, `GET /api/race/:id/stream`,
   `POST /api/route`, `GET /api/bench/latest`, `GET /api/runs/:id`.
4. SSE events: `decision`, `shortlist`, `lane_start`, `lane_tokens`, `lane_done`, `final`,
   `error`. Decisions stream the moment they exist.
5. One error envelope, `{ error: { code, message, requestId, retryAfter? } }`, with codes
   `BAD_REQUEST, NOT_FOUND, RATE_LIMITED, BUDGET_EXHAUSTED, DECIDER_UNAVAILABLE,
   BEDROCK_THROTTLED, INTERNAL`.
6. Request IDs, per-IP rate limiting, a per-UTC-day spend kill switch, request timeouts and
   Bedrock retry with backoff.
7. Persistence for runs, lane results, decision logs and bench runs.

### 2.4 Data layer (`supabase/`, `catalog/`, owned by `database`)
1. Migrations for indexes, RLS and the spend counter.
2. RLS: public `select` on `tools` and `bench_runs` only. The service-role key never reaches
   the browser.
3. `catalog/` generates 240 fictional tools across 12 categories and ~800 labelled queries
   (direct, paraphrase, ambiguous, no-tool and hand-written), split 50/50 into dev and test.
4. Star positions are computed once by a force layout and stored in `tools.x`, `tools.y`.

### 2.5 UI (`web/`, owned by `frontend`)
1. Routes: `/` Atlas, `/almanac`, `/index`, `/method`, plus error screens.
2. Design system: the exact palette, self-hosted open fonts, hairline linework, numbered
   plates, no gradients, no glassmorphism, no neon, no purple. `prefers-reduced-motion`,
   brass focus rings and `aria-live` are mandatory.
3. Splash "First Light" on the first visit per session, skippable, preloading fonts and the
   catalog, with a hard time cap.
4. Loaders: "Charting", "Calibrating the instrument", race stage labels, inline pulsing star.
5. Replay mode: three recorded races as JSON in the shared SSE schema, played through the
   same reducer, labelled "Recorded flight".
6. One config-driven error screen with all nine variants and one `errorMapper`.
7. Data router with `errorElement`, TanStack Query for REST, `useRaceStream` for SSE, a
   `useReducer` race state machine.

### 2.6 Benchmark (`bench/`, owned by `backend`)
1. Configs A (all tools), B (flat top-k), C (hierarchical adaptive).
2. Decider-only metrics on the whole test split: `recall@1/3/6`, tier distribution, p50/p95.
3. End-to-end Bedrock on a ~150-query sample; tokens read from the response, not from formulas.
4. Accuracy, recall@k, tokens, latency, cost per 1 000 requests, share resolved at tier
   `direct`, a reliability table and a failure table.

### 2.7 Deployment (`infra/`, owned by `deployment`)
1. `infra/setup.sh`, `decider.service`, `polaris-api.service`, a Caddyfile that does not
   buffer SSE, and an IAM role with Bedrock invoke permission.
2. `vercel.json` rewrites all routes to `index.html`.
3. `scripts/deploy.sh` and `docs/RUNBOOK.md`.

## 3. Success criteria

- [ ] `npm install && npm run typecheck && npm test` green at the repository root.
- [ ] A race streams the seven SSE events, in order, from the Express API.
- [ ] The web app renders a live race and a recorded flight through the same reducer.
- [ ] The Almanac tables are rendered from `bench/results.json`, not hardcoded.
- [ ] Every number in `PATTERN.md`, the UI and the article traces to a run in this repo.
- [ ] Four branches merged into `main` with merge commits, CI green, `v1.0.0` tagged.

## 4. Out of scope

Authentication, multi-tenant support, a second routing pattern, a Python Strands example
(only if the SDK exposes a pre-model hook), and community-contributed catalogs.
