# POLARIS: master roadmap

> **Status:** ACTIVE
> **Spec:** `.gsd/SPEC.md` (FINALIZED 2026-10-21)
> **Execution plan:** `plan/execution-plan.md`
> **Rules:** `PROJECT_RULES.md` — SPEC → PLAN → EXECUTE → VERIFY → COMMIT

## Phase status

| Phase | Branch | Deliverable | Status |
|---|---|---|---|
| **P0** | `main` | Contract commit: LICENSE, README, `.env.example`, workspaces, `packages/contracts`, `supabase/migrations/0001_init.sql`, `docs/api.md`, `docs/adr/*`, CI, tag `v0.0.1-contracts` | IN PROGRESS |
| **P1** | `database` | Migrations, RLS, spend counter, catalog and query generators, star layout, seed | PENDING |
| **P2** | `backend` | Merge main; error envelope, zod validation, SSE contract alignment, timeouts, daily kill switch, router fixes, health, `runId`, Bedrock retry, persistence | PENDING |
| **P3** | `backend` | Benchmark configs A/B/C, recall@1/3/6, p50/p95, reliability and failure tables, `PATTERN.md` rewrite | PENDING |
| **P4** | `frontend` | Merge main; folder layout, data router + errorElement, design system, fonts, a11y | PENDING |
| **P5** | `frontend` | API client, race machine, SSE hook, loaders, replay JSON, error mapper, Almanac from the API | PENDING |
| **P6** | `deployment` | Infra scripts, systemd, Caddy, IAM, `vercel.json`, deploy script, runbook | PENDING |
| **P7** | `integration` | Disposable merge of all four branches; boot, test, fix in the owning branch | PENDING |
| **P8** | `main` | Final merges, lockfile, README assembly, `CHANGELOG.md`, tag `v1.0.0` | PENDING |

## Wave map

| Wave | Phases | Note |
|---|---|---|
| Wave 1 | P0 | Contract. Everything else depends on it. |
| Wave 2 | P1, P2, P4 | Independent branches, safe to interleave. |
| Wave 3 | P3 (needs P1), P5 (needs P2+P3), P6 | Sequential in effect because P3 and P5 share the payload shapes. |
| Wave 4 | P7 | Integration dry run. |
| Wave 5 | P8 | Final merge. |

## Branch ownership

| Branch | Owns | Never edits |
|---|---|---|
| `main` | root, `packages/contracts/`, `supabase/migrations/0001_init.sql`, `docs/api.md`, `docs/adr/`, `.github/workflows/ci.yml` | `web/`, `server/`, `packages/router/`, `bench/`, `infra/`, `catalog/` |
| `database` | `supabase/`, `catalog/`, `docs/database.md` | everything else |
| `backend` | `server/`, `packages/router/`, `bench/`, `docs/backend.md` | everything else |
| `frontend` | `web/`, `docs/frontend.md` | everything else |
| `deployment` | `infra/`, `.github/workflows/deploy*`, `vercel.json`, `scripts/deploy.sh`, `docs/RUNBOOK.md`, `docs/deployment.md` | everything else |

## Pre-merge checklist (every PR)

- [ ] typecheck green
- [ ] tests green
- [ ] no secrets in the diff
- [ ] branch README section in `docs/<branch>.md` updated
- [ ] no edits outside the branch's owned folders
