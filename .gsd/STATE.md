# GSD current state

> Last updated: 2026-10-21
> Active branch: `main`
> Current phase: **P0 — contract commit**
> Spec: `.gsd/SPEC.md` (FINALIZED)
> Execution plan: `plan/execution-plan.md`

## Position in roadmap

| Phase | Description | Status |
|---|---|:---:|
| P0 | Contract commit | IN PROGRESS |
| P1 | Data layer (`database`) | PENDING |
| P2 | Backend hardening (`backend`) | PENDING |
| P3 | Benchmark + pattern (`backend`) | PENDING |
| P4 | Frontend shell + design system (`frontend`) | PENDING |
| P5 | Frontend wiring (`frontend`) | PENDING |
| P6 | Deployment (`deployment`) | PENDING |
| P7 | Integration dry run | PENDING |
| P8 | Final merge | PENDING |

## Repository state at session start

| Branch | Commits | Owns | Assessment |
|---|---:|---|---|
| `main` | 1 | — | Only `.gitignore` and the plan. No contract commit. |
| `database` | 1 | — | Identical to `main`. Nothing built. |
| `deployment` | 1 | — | Identical to `main`. Nothing built. |
| `backend` | 18 | `server/`, `packages/router/`, `bench/` | Router, agent, API, SSE and bench exist. SSE event names, error codes, zod validation, timeouts, Bedrock retry, real persistence and most benchmark metrics are missing. Decider and Bedrock fall back to simulators by default. |
| `frontend` | 6 | `web/` | Visually rich static UI. No API wiring, no loaders, no reducer, no replay JSON, no error mapper, design system drifts from the plan palette. |

Known blockers found by the audit:

1. No `packages/contracts` on any branch, so server and web cannot share schemas.
2. Backend SSE events are `race:init/lane:stage/lane:result/race:complete/race:error`; the plan and the backend's own spec require `decision/shortlist/lane_start/lane_tokens/lane_done/final/error`.
3. Backend error codes are `RATE_LIMIT_EXCEEDED`/`RACE_NOT_FOUND`/`INTERNAL_SERVER_ERROR` with `retryAfterSeconds`; the plan requires `RATE_LIMITED`/`NOT_FOUND`/`INTERNAL` with `retryAfter`.
4. `thresholds.json` is never loaded; thresholds are hardcoded in `packages/router/src/tiers.ts`.
5. A `"no"` noul answer is truthy, so the zero-tool gate never fires (`packages/router/src/deciderClient.ts`).
6. `ask_clarification` is never materialised for the fallback tier.
7. Benchmark token, latency and cost figures are hardcoded constants; the query set has 20 entries, not ~800; no reliability table, no failure table, no `recall@6`, no p95.
8. `PATTERN.md` and the Almanac publish figures that no run in this repo produced.
9. Frontend labels a canned replay as `source: 'live'`.

## Immediate next action

P0 on `main`: repo hygiene, npm workspace root, `packages/contracts`, `supabase/migrations/0001_init.sql`,
`docs/api.md`, `docs/adr/*`, CI, tag `v0.0.1-contracts`.

## Working rules for this session

- One task, one commit, conventional message with the branch scope.
- Verify before commit; capture the command output.
- Merge `main` into a branch before working on it, so the contracts are available.
- Never edit another branch's folder.
- Keep the numbers honest: label simulated output as simulated.
