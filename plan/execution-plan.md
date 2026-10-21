# POLARIS: execution plan (branch-wise, phased)

> Derived from `plan/final-plan.md`. This file turns the plan's day-by-day narrative into
> **phase → branch → task** units that can be executed and verified one at a time.
> Branch ownership follows `final-plan.md` §4.2: a branch never edits another branch's folders.

## 0. Rules of execution

| Rule | Detail |
|---|---|
| Contract first | `packages/contracts`, `supabase/migrations/0001_init.sql`, `docs/api.md`, CI and `LICENSE` land on `main` in the Phase 0 commit, tagged `v0.0.1-contracts`. Every later branch merges `main` before doing its own work. |
| Folder ownership | `frontend` → `web/`. `database` → `supabase/`, `catalog/`. `backend` → `server/`, `packages/router/`, `bench/`. `deployment` → `infra/`, `.github/workflows/deploy*`, `vercel.json`, `docs/RUNBOOK.md`. `main` → root, `packages/contracts/`, `docs/api.md`, `docs/adr/`, `.github/workflows/ci.yml`. |
| Shared files | `package.json` (root), `package-lock.json`, `README.md`, `.env.example` are edited on `main` only. Lockfiles are regenerated with `npm install` after each merge, never hand-resolved. |
| One task, one commit | Conventional commits with the branch scope: `feat(backend):`, `chore(database):`, `docs(frontend):`. Commit scope is the phase number for phase work. |
| Verify before commit | Every task carries an executable verification command. "Looks correct" is not proof. |
| Honest numbers | No accuracy, token, latency or cost figure ships unless it came out of a run in this repo. Simulated numbers are labelled `simulated`. |

## 1. Phase → branch map

| Phase | Branch | Deliverable | Gate |
|---|---|---|---|
| **P0** | `main` | Contract commit: LICENSE, README, `.env.example`, npm workspaces, `packages/contracts`, `supabase/migrations/0001_init.sql`, `docs/api.md`, `docs/adr/*`, CI | `v0.0.1-contracts` tag pushed |
| **P1** | `database` | Migrations 0002–0004 (indexes, RLS, spend counter), `catalog/` generators + `tools.json` + `queries.json`, layout, seed, `supabase/README.md` | 240 tools and ~800 labelled queries generated, 50/50 dev/test split fixed |
| **P2** | `backend` | Merge `main`. Shared contracts adopted. SSE event names aligned to §8. zod request validation. One error envelope with §6.7 codes. Request timeouts. Real daily spend kill switch. `thresholds.json` loaded and tested. `ask_clarification` fallback tool. `noul` answer parsing fixed. `decider: loading\|ready\|down` in `/api/health`. `runId` on `POST /api/race`. Bedrock retry with backoff and `BEDROCK_THROTTLED`. | `npm test` green in `packages/router` and `server` from a clean install |
| **P3** | `backend` | Benchmark: config A (all tools), B (flat top-k), C (hierarchical adaptive). `recall@1/3/6`, tier distribution, p50/p95, ~150-query end-to-end sample, measured tokens/latency/cost, cost per 1 000, share resolved at tier `direct`, reliability table, failure table. `PATTERN.md` rewritten with the exact `/v1/systemone` JSON bodies, a curl recipe, threshold-tuning guidance, known failure modes, and only measured figures. | `bench/results.json` regenerates from `npm run bench` and every claim in `PATTERN.md` traces to it |
| **P4** | `frontend` | Merge `main`. §6.1 design system corrected to the plan palette, no gradients/glass/neon, self-hosted `@fontsource` fonts, brass focus rings, `prefers-reduced-motion`, `aria-live`. §6.8 folder layout, data router with `errorElement`, global error boundary. | `npm run typecheck` and `npm run build` green in `web/` |
| **P5** | `frontend` | Race state machine (`useReducer`), `useRaceStream` SSE hook with reconnect, TanStack Query for REST, API client with base URL. §6.5 loaders (Charting, Calibrating the instrument, race stages, inline star). §6.6 replay JSON in `web/public/replays/` using the shared SSE schema, same reducer, labelled "Recorded flight". §6.7 `errorMapper` and all nine variants. Almanac reads `/api/bench/latest`. | A replay animates through the same reducer as a live race; every error variant is reachable from the dev menu |
| **P6** | `deployment` | `infra/setup.sh`, `decider.service`, `polaris-api.service`, `Caddyfile` with SSE flushing, IAM role, `vercel.json` SPA rewrite, `scripts/deploy.sh`, `docs/RUNBOOK.md` | `bash -n` passes on every shell script; `vercel.json` parses |
| **P7** | `integration` (disposable) | Merge all four branches, boot the app, fix defects in the owning branch, delete the branch | The full stack runs locally end to end |
| **P8** | `main` | Final merges in dependency order (§4.5): `database` → `backend` → `frontend` → `deployment`. Regenerate the lockfile, assemble the README from the per-branch `docs/*.md`, `CHANGELOG.md`, tag `v1.0.0` | `main` builds, tests and deploys cleanly |

## 2. Dependency graph

```
P0 (main: contracts)
 ├─> P1 (database) ──────────────┐
 ├─> P2 (backend: harden) ───────┤
 │     └─> P3 (backend: bench) ───┤
 ├─> P4 (frontend: design+shell) ┤
 │     └─> P5 (frontend: wire) ───┤
 └─> P6 (deployment) ─────────────┤
                                   v
                        P7 (integration dry run)
                                   v
                        P8 (final merge to main)
```

`P1`, `P2` and `P4` are independent of each other and can run in any order after `P0`.
`P3` needs `P1` (the generated query set) and `P5` needs `P2` (the SSE contract) and `P3`
(the benchmark payload the Almanac renders).

## 3. Phase P0 — contract commit (branch `main`)

**Why first.** Every other branch imports `packages/contracts` and every route in `docs/api.md`
is checked against it. Doing this later means re-touching four branches.

| Task | Files | Done when |
|---|---|---|
| 0.1 Repo hygiene | `LICENSE`, `README.md`, `.env.example`, `.editorconfig`, `.nvmrc`, `.gitignore` | Apache-2.0 header present; every env var documented with no secrets |
| 0.2 Workspace root | `package.json` (npm workspaces), `tsconfig.base.json`, `eslint.config.js`, `.prettierrc` | `npm install` at the root installs `packages/contracts` |
| 0.3 Shared contracts | `packages/contracts/src/{events,errors,catalog,api,index}.ts`, `packages/contracts/package.json`, `packages/contracts/tsconfig.json` | SSE event union, error envelope, catalog and shortlist shapes are exported as zod schemas and inferred types |
| 0.4 Database schema | `supabase/migrations/0001_init.sql` | The seven tables of §7 exist verbatim, including `descriptor`, `x`, `y` |
| 0.5 API docs | `docs/api.md` | Every §8 route with method, request body, response body, error codes |
| 0.6 ADRs | `docs/adr/0001-hierarchical-routing.md`, `0002-sse.md`, `0003-ec2-express-vercel-ui.md`, `0004-service-role-key.md` | Four ADRs, each with Context / Decision / Consequences |
| 0.7 CI | `.github/workflows/ci.yml` | lint, typecheck, test, build with path filters |
| 0.8 Plan artefacts | `.gsd/SPEC.md`, `.gsd/ROADMAP.md`, `.gsd/STATE.md`, `.gsd/phases/plan-0.1.md` … | GSD state reflects this plan |
| 0.9 Tag | — | `v0.0.1-contracts` |

**Merge conflict pre-empt.** `backend` already owns `.gsd/SPEC.md`, `.gsd/ROADMAP.md` and
`.gsd/STATE.md`. Before merging `main` into `backend`, rename those to `SPEC-backend.md`,
`ROADMAP-backend.md` and `STATE-backend.md` in a `chore(backend)` commit so the merge is clean.

## 4. Phase P1 — data layer (branch `database`)

| Task | Files | Done when |
|---|---|---|
| 1.1 Indexes | `supabase/migrations/0002_indexes.sql` | Indexes on `tools.category`, `eval_queries.split`, `lane_results.run_id`, `decision_logs.run_id` |
| 1.2 RLS | `supabase/migrations/0003_rls.sql` | Public `select` only on `tools` and `bench_runs`; everything else service-role only |
| 1.3 Spend counter | `supabase/migrations/0004_spend.sql` | Daily spend table keyed by date, for the kill switch |
| 1.4 Catalog generator | `catalog/generate-catalog.ts` | 240 fictional, generically named tools across 12 categories, each with a ≤12-word descriptor and an input schema. No real brand names |
| 1.5 Query generator | `catalog/generate-queries.ts` | 3 queries per tool (direct, paraphrase, ambiguous) + ~100 no-tool queries + ~40 hand-written `kind = human`; 50/50 dev/test split fixed and written down |
| 1.6 Star layout | `catalog/layout.ts` | Positions computed once with a force layout and written to `tools.x`, `tools.y`; never recomputed at runtime |
| 1.7 Outputs | `catalog/tools.json`, `catalog/queries.json` | Both files regenerate with `npm run catalog` and are byte-stable |
| 1.8 Seed + docs | `supabase/seed.sql`, `supabase/README.md`, `docs/database.md` | Seed is idempotent; docs explain the schema and the split |

## 5. Phase P2 — backend hardening (branch `backend`)

| Task | Files | Done when |
|---|---|---|
| 2.0 Merge main | — | `git merge main` is clean after the `.gsd` rename |
| 2.1 Error envelope | `server/src/middleware/safety.ts`, `server/src/lib/errors.ts` | One helper emits `{ error: { code, message, requestId, retryAfter? } }` with codes `BAD_REQUEST, NOT_FOUND, RATE_LIMITED, BUDGET_EXHAUSTED, DECIDER_UNAVAILABLE, BEDROCK_THROTTLED, INTERNAL`; `retryAfter` (not `retryAfterSeconds`) |
| 2.2 Request validation | `server/src/routes/*.ts` | Every body and param is parsed with a zod schema from `packages/contracts`; a bad body returns `BAD_REQUEST` |
| 2.3 SSE contract | `server/src/sse/raceStream.ts`, `server/src/routes/race.ts` | Events are exactly `decision, shortlist, lane_start, lane_tokens, lane_done, final, error`; `decision` and `shortlist` are emitted the moment Decider answers, not after the lane resolves |
| 2.4 Timeouts | `server/src/middleware/safety.ts` | Every request has an abort deadline; a slow handler returns `INTERNAL` with a request ID, not a hung socket |
| 2.5 Kill switch | `server/src/middleware/safety.ts` | Spend is bucketed per UTC day, resets on the day boundary, and the recorded amount is the real cost in USD |
| 2.6 Router fixes | `packages/router/src/tiers.ts`, `packages/router/src/deciderClient.ts`, `packages/router/src/thresholds.ts` | `thresholds.json` is loaded (not hardcoded) and has a unit test; `ask_clarification` is materialised for the fallback tier; a `"no"` noul answer yields low confidence and triggers the zero-tool path; the `workflows` category has a real descriptor |
| 2.7 Health | `server/src/routes/api.ts` | `/api/health` reports `{ api, decider: loading\|ready\|down, bedrock }` from a real probe |
| 2.8 Run identity | `server/src/routes/race.ts` | `POST /api/race` returns `runId`; `GET /api/runs/:id` replays a finished run |
| 2.9 Bedrock resilience | `server/src/agent/bedrock.ts` | Retry with exponential backoff on throttle; `BEDROCK_THROTTLED` surfaces; a real error is never silently replaced by the simulator |
| 2.10 Persistence | `server/src/db/*.ts` | Runs, lane results and decision logs are written through a repository that uses Supabase when configured and a file-backed store otherwise |
| 2.11 Tests | `server/src/**/*.test.ts` | Tests cover the error envelope, rate limit, kill switch, SSE event names and the Decider two-call protocol |

## 6. Phase P3 — benchmark and pattern (branch `backend`)

| Task | Files | Done when |
|---|---|---|
| 3.1 Config A | `bench/run.ts` | All-tools baseline measured, not hardcoded |
| 3.2 Config B | `bench/run.ts` | Flat single-`choice`-over-240-names variant implemented and measured |
| 3.3 Config C | `bench/run.ts` | Hierarchical adaptive variant measured |
| 3.4 Decider metrics | `bench/run.ts` | `recall@1/3/6`, tier distribution, p50/p95 over the whole test split |
| 3.5 End-to-end | `bench/run.ts` | ~150-query sample with real Bedrock calls; token counts read from Bedrock response metadata, not formulas |
| 3.6 Tables | `bench/reliability.ts`, `bench/failures.ts` | Reliability table (confidence bucket vs actual accuracy) and failure table are produced as data and as Markdown |
| 3.7 Cost | `server/src/agent/pricing.ts` | Cost reported per 1 000 requests and per 10 000 |
| 3.8 Export | `bench/results.json` | Regenerated by `npm run bench`; contains accuracy, recall@k, tokens, p50/p95, cost, tier share, reliability and failure tables |
| 3.9 PATTERN.md | `packages/router/PATTERN.md` | Exact `/v1/systemone` request bodies for the `noul` and `choice` questions, the 12-category label list, the ~5-line wiring, a curl-only recipe, threshold-tuning guidance, the 4 096-token limit, known failure modes. Every number traces to `bench/results.json` or is labelled simulated |

## 7. Phase P4 — frontend shell and design system (branch `frontend`)

| Task | Files | Done when |
|---|---|---|
| 4.0 Merge main | — | `git merge main` is clean |
| 4.1 Layout | `web/src/{app,pages,components/{chart,race,trace,errors,splash,loaders},hooks,state,styles,lib}` | The §6.8 folder structure exists; `web/src/types.ts` is replaced by `packages/contracts` types |
| 4.2 Router | `web/src/app/router.tsx`, `web/src/app/ErrorBoundary.tsx` | `createBrowserRouter` with `errorElement` on every route plus a global error boundary |
| 4.3 Tokens | `web/src/styles/tokens.css` | Exact §6.1 palette (`--ink-900 #070B16` … `--ember #E0673A`), `--parchment`, `--parchment-dim`, `--haze` present; gradients, `backdrop-filter` glass, cyan/neon and purple removed |
| 4.4 Fonts | `web/package.json`, `web/src/styles/fonts.ts` | Cormorant Garamond, Newsreader and IBM Plex Mono self-hosted via `@fontsource`; no third-party font request |
| 4.5 Motion + a11y | all components | `prefers-reduced-motion` honoured; brass focus-visible rings on every interactive element; `aria-live` region for race status |
| 4.6 Script hygiene | `web/package.json` | `lint`, `typecheck`, `build`, `test` scripts exist and pass |

## 8. Phase P5 — frontend wiring (branch `frontend`)

| Task | Files | Done when |
|---|---|---|
| 5.1 API client | `web/src/lib/api.ts` | Base URL from `VITE_API_BASE_URL`; typed calls to `/api/health`, `/api/catalog`, `/api/race`, `/api/bench/latest`, `/api/runs/:id` |
| 5.2 REST hooks | `web/src/hooks/useCatalog.ts` etc. | TanStack Query used for every REST call |
| 5.3 Race machine | `web/src/state/raceReducer.ts` | `useReducer` over `idle → deciding → racing → done \| error`, driven by the shared SSE event types |
| 5.4 SSE hook | `web/src/hooks/useRaceStream.ts` | `EventSource` to `/api/race/:id/stream` with reconnect and backoff, feeding the reducer |
| 5.5 Loaders | `web/src/components/loaders/*` | Charting skeleton, "Calibrating the instrument" with `/api/health` polling and backoff falling through to the offline screen, race stage labels, inline pulsing star |
| 5.6 Replays | `web/public/replays/*.json` | Three recorded races (easy, ambiguous, no-tool) as SSE event logs using the shared schema; the player feeds the same reducer and the UI says "Recorded flight" |
| 5.7 Errors | `web/src/lib/errorMapper.ts`, `web/src/components/errors/*` | One mapper turns the envelope into a variant; all nine variants exist including `inline_validation`; each has its own constellation SVG, one primary action and a copyable request ID; `retryAfter` drives a countdown; `navigator.onLine` drives `no_network`; `signal_lost` keeps partial results and retries with backoff |
| 5.8 Almanac | `web/src/pages/AlmanacPage.tsx` | Pareto chart, latency, reliability table and failure table are rendered from `/api/bench/latest`; no hardcoded headline metrics |
| 5.9 Atlas layout | `web/src/pages/AtlasPage.tsx` | Star chart left; Plate I query, Plate II race, Plate III decision trace on the right, as drawn in §6.2 |
| 5.10 Star chart | `web/src/components/chart/StarChart.tsx` | Positions come from the server catalog (`x`, `y`); constellations pulse by `P(category)`; the shortlisted ring radius equals the confidence; hover shows name, descriptor and score |
| 5.11 Honesty | all pages | No screen labels recorded data as live; no unmeasured number appears |

## 9. Phase P6 — deployment (branch `deployment`)

| Task | Files | Done when |
|---|---|---|
| 6.1 Instance setup | `infra/setup.sh` | Installs Python, `strands-decider`, Node and Caddy on Ubuntu |
| 6.2 Services | `infra/systemd/decider.service`, `infra/systemd/polaris-api.service` | Restart on failure, correct environment, decider on 8000 and API on 3000 |
| 6.3 TLS proxy | `infra/Caddyfile` | Automatic certificates, SSE not buffered on the stream route, CORS locked to the app domain |
| 6.4 IAM | `infra/iam-role.json`, `infra/README.md` | Bedrock invoke permission attached to the instance profile; no static keys |
| 6.5 Vercel | `vercel.json` | SPA rewrite to `index.html` so deep links reach React Router and the 404 screen works |
| 6.6 Deploy script | `scripts/deploy.sh` | One command to build, push and restart; fails loudly on a failed health check |
| 6.7 Pipeline | `.github/workflows/deploy.yml` | Build and artifact upload on `main` |
| 6.8 Runbook | `docs/RUNBOOK.md` | Start, stop, redeploy, logs, budget alarm, GPU instance lifecycle |

## 10. Phase P7 — integration dry run (branch `integration`, disposable)

1. `git checkout -b integration main`
2. Merge `database`, `backend`, `frontend`, `deployment` in dependency order.
3. `npm install` at the root to regenerate the lockfile.
4. Boot the server and the web app; run one race end to end; load every route.
5. Fix every defect in the owning branch, then re-merge.
6. Delete `integration` once `main` carries the fixes.

## 11. Phase P8 — final merge (branch `main`)

1. Merge in the §4.5 order: `database`, `backend`, `frontend`, `deployment`, each with `--no-ff`.
2. Regenerate the lockfile with `npm install`.
3. Assemble `README.md` from `docs/{database,backend,frontend,deployment}.md`.
4. Write `CHANGELOG.md`.
5. Confirm no secrets, no third-party trademarks, Apache-2.0 `LICENSE` present.
6. Tag `v1.0.0` and deploy from `main`.

## 12. Cut list (apply in this order if time runs out)

1. Playwright smoke test and any test beyond the core logic tests.
2. `/index` page (keep Atlas, Almanac, Method).
3. Run-history replay page.
4. The `needs_tool` question.
5. The flat routing variant (keep hierarchical).
6. Per-category adaptive thresholds.

**Never cut:** the race demo, the benchmark with its reliability and failure tables, the reusable
package with `PATTERN.md`, replay mode, the splash, the loaders and the error screens, the
AWS-hosted backend, the video and the article.
