# POLARIS: final plan

One decision, 240 tools. A Decider 2B tool router in front of Amazon Bedrock, with a celestial-atlas UI.

- **Hackathon:** AWS Strands Decider Agent Hackathon. Pattern: **Tool selection**. Tags: `#strands-decider-2b` and `#tool-selection`.
- **Stack:** React (Vite, TypeScript) / Node + Express (TypeScript) / Supabase (Postgres) / Amazon Bedrock / Strands Decider 2B.
- **Hosting:** React on Vercel. Express (and Decider if possible) on EC2. Supabase hosted.
- **Deadline:** Fri Oct 23, 11:59 PM PT = **Sat Oct 24, ~12:29 PM IST**. Plan to submit **Thu Oct 22**.
- This file supersedes `plan.md` (Tripwire) and `polaris-3day-plan.md`.

---

## 1. Problem statement

Agents with hundreds of tools (MCP servers, internal APIs) pay for it on every request: tens of thousands of tokens of tool schemas, seconds of latency, and wrong calls when the list is long.

**Polaris puts Decider 2B in front of the LLM.** In one fast, local decision it narrows 240 tools to the 1 to 6 the request needs, and the shortlist size is set by Decider's calibrated confidence. Bedrock only sees those tools. We measure what that saves and what it costs in accuracy.

**Honest framing (use it in the article).** A modern LLM can often pick correctly from 240 tools. The claim to prove is *similar accuracy at far lower tokens and latency*, not "the LLM fails". Do not claim an accuracy gain unless you measure one. Decider is experimental (about 72% on its own public benchmark), so the design uses a forgiving top-k shortlist, not a hard yes/no gate.

**What makes it stand out**
1. A real, current pain (tool overload) with a **measured Pareto curve**: tokens saved versus accuracy kept.
2. **Confidence-adaptive shortlist:** high confidence sends 1 tool, medium 3, low 6, very low widens and asks to clarify.
3. **Several typed questions in one Decider request** (needs a tool? which category? which tool?), because questions about the same text are cheap.
4. The **Agent Race** demo, a star-chart UI, and a **deterministic replay mode**.
5. A drop-in package (`compileCatalog` + `shortlistTools`) others can reuse.

---

## 2. Rules checklist (from the T&Cs)

- Solo is fine. One entry per person. India is not excluded. 18+ with a builder.aws.com profile.
- **Required:** Decider 2B plus Amazon Bedrock. "Working agent on AWS" is undefined in the rules and EC2 is not named, so **host the Express backend on a small EC2 instance** (it calls Bedrock through an IAM role). Ask in the hackathon Discussion tab whether Decider must also run on AWS.
- **Pass/fail:** article on Builder Center, public repo with the agent and a clearly labelled reusable pattern, and a demo video.
- **Repo:** public, **OSI-approved license** (use Apache-2.0).
- **Video:** under 3:00, public on YouTube, Vimeo, Facebook Video or Youku. No third-party trademarks, no copyrighted music.
- **Tags:** `#strands-decider-2b` and `#tool-selection`.
- Build inside the Submission Period (starts Oct 16, 9:00 AM PT). Do not submit anything published before it.
- Conduct: no malicious code. Tools are mocks and labelled "simulated".

---

## 3. Facts to verify on Day 1 (public Decider docs; log results in `docs/notes.md`)

- `pip install strands-decider`, then `strands-decider serve <model> --port 8000`. Python 3.10+. Use **WSL2** (the published GPU latency was measured under it).
- Endpoint: `POST /v1/systemone` with `{ "state": "...", "questions": { "<id>": { "type": "noul", "instructions": "..." } } }`. Response has `answers`, `usage`, `latency_ms`.
- Types: `noul` (yes/no, closer to 1 = yes), `choice` (one of N), `score`. **VERIFY** the exact JSON for `choice` options and the per-option output.
- **Context window is 4096 tokens.** State plus all option lists must fit.
- Checkpoint: start with the repo's recommended one, and compare v19 vs v21 on your dev split.
- The docs say 0.9+ confidence was right about 95% of the time on their tasks. **Re-measure on your catalog** and set thresholds from your own reliability table.
- **Check whether Bedrock Converse caps tools per request.** If it does, use a 150-tool baseline and report it.

---

## 4. Git workflow: four branches, merged after the code is complete

This is part of the maintainability story. The risk of long-lived branches is a painful merge at the end, so the plan removes that risk up front.

### 4.1 The contract commit (first 90 minutes, on `main`)
Before any branch exists, commit the things all four branches depend on:

- npm workspaces monorepo skeleton, TypeScript strict config, ESLint, Prettier, `.editorconfig`.
- `LICENSE` (Apache-2.0), README stub, `.env.example` (every variable, no secrets).
- `packages/contracts`: **zod schemas and TypeScript types** for (a) SSE race events, (b) the error envelope, (c) catalog and shortlist shapes. Server and web both import these.
- `supabase/migrations/0001_init.sql`: the v1 schema (section 7).
- `docs/api.md`: the route table (section 8).
- A GitHub Actions CI workflow (lint, typecheck, test, build, with path filters).

Tag it `v0.0.1-contracts`. Then create the four branches from that tag.

### 4.2 Branches and folder ownership

| Branch | Owns (only edit these) | Delivers |
|---|---|---|
| `frontend` | `web/` | The whole UI, running against **mock and replay data** so it never waits for the backend |
| `database` | `supabase/`, `catalog/` | Migrations, RLS, seed scripts, generated catalog and eval queries |
| `backend` | `server/`, `packages/router/`, `bench/` | Express API, SSE, router, agent loop, rate limit, benchmark |
| `deployment` | `infra/`, `.github/workflows/deploy*`, `vercel.json`, `docs/RUNBOOK.md` | EC2 setup, systemd, Caddy, Vercel config, deploy scripts |

Rule: **a branch never edits another branch's folders.** That is what makes the final merge mostly conflict-free. The shared files are `package-lock.json`, root `package.json`, README and `.env.example`. Keep root edits to the contract commit, and regenerate the lockfile after merging (`npm install`) instead of hand-resolving it.

### 4.3 Working practices
- Use `git worktree` so you can have all four branches checked out side by side: `git worktree add ../polaris-frontend frontend`, and so on. No stashing and switching.
- **Conventional commits with a scope:** `feat(frontend): splash sequence`, `fix(backend): SSE flush`, `chore(database): seed script`. This produces a readable history and a free changelog.
- If a contract must change, change it **on `main`** in a tiny commit, then `git merge main` into each branch. Never fork the contract.
- Small commits, at least a few per block of work, each passing typecheck.
- Each branch keeps its own short `README.md` section file under `docs/` (`docs/frontend.md`, `docs/backend.md`, and so on). These are assembled into the root README at the end, which avoids README conflicts.

### 4.4 Integration dry run (end of Day 2)
Waiting until the very end to merge is the main risk. So at the end of Day 2, create a **disposable** `integration` branch from `main`, merge all four branches into it, run the app, and fix problems in the owning branch. This branch is not a fifth work branch. Delete it after Day 3. Deploy the first EC2 and Vercel build from `integration`.

### 4.5 Final merge (Day 3 evening, after feature freeze)
Merge order follows dependencies, one PR per branch with `--no-ff` merge commits so each branch's history stays visible:

1. `database` into `main`
2. `backend` into `main`
3. `frontend` into `main`
4. `deployment` into `main`

Each PR needs a green CI run and a short checklist (typecheck, tests, no secrets, docs updated). Then regenerate the lockfile, assemble the README, update `CHANGELOG.md`, tag **`v1.0.0`**, and deploy from `main`.

### 4.6 Maintainability evidence to show in the repo
- Strict TypeScript everywhere, and shared **zod contracts** validated on both sides.
- One **error envelope** and one config-driven error screen component (section 6.7).
- **Unit tests** for the parts that carry the logic: score combination, tier selection, threshold loading, the error mapper, the race-event reducer.
- 3 or 4 short **ADRs** in `docs/adr/`: why hierarchical routing, why SSE, why Express runs on EC2 while the UI is on Vercel, why the service-role key never reaches the browser.
- `RUNBOOK.md`, `CHANGELOG.md`, conventional commits, a clean `v1.0.0` tag.

---

## 5. Architecture and AI integration

```
 Vercel (static React app, always on)            Supabase (Postgres)
   │  bundled replay JSON (works offline)              ▲
   │  REST + SSE (HTTPS, CORS locked to the app)       │ service-role key, server only
   ▼                                                   │
 EC2 ── Caddy (TLS, SSE not buffered) ─► Express API ──┘
                                          ├─ router/  (Polaris)  ──► Decider 2B  (localhost:8000)
                                          └─ agent/   (Bedrock Converse + mock tools)
                                                 ├─ Lane A "All tools": 240 schemas
                                                 └─ Lane B "Polaris":   shortlisted only
                                                        ▼
                                                  Amazon Bedrock
```

### Decision flow (Lane B)
1. **Call 1** to Decider, state = the user request, two questions in one request:
   - `needs_tool` (noul): "Does this request require calling an external tool or API, rather than answering from general knowledge?"
   - `category` (choice): one of about 12 categories, each with a short descriptor.
2. **Call 2** to Decider, same state, one `tool` choice question **per top-2 category**, listing only that category's tools (name plus a descriptor of 12 words or fewer).
3. Combine: `score = P(category) × P(tool | category)`. Take the top-k by score.
4. Tier by the top-1 score (starting values, tune on the dev split):

| Tier | Top-1 score | Tools sent to Bedrock |
|---|---|---|
| direct | 0.85 or more | 1 |
| narrow | 0.55 to 0.85 | 3 |
| wide | 0.30 to 0.55 | 6 |
| fallback | below 0.30 | 12 plus an `ask_clarification` tool |

5. If `needs_tool` is clearly no, send **zero** tools.
6. Bedrock fills in the arguments and calls the mock tool, then answers.

**Free experiment:** also test a **flat** variant (one `choice` over all 240 tool names, no descriptors, about 2.5K tokens). Keep whichever wins on recall@k and latency.

### Why Vercel stays (and what it buys you)
The static UI on Vercel is **always on**, even when you stop the GPU instance to save money. The UI ships with **recorded race replays** (section 6.6), so a judge who opens the link after the instance is stopped still sees a working demo and a clear "observatory offline" page, not a blank screen. The trade-off is cross-origin calls: connect SSE directly from the browser to the EC2 hostname (not through a Vercel proxy, which can buffer streams) and lock CORS to the app's domain.

### Decider placement ladder
1. A GPU instance if your quota is approved (request it in the first 30 minutes; new accounts often start at 0).
2. A CPU instance, with the measured latency reported honestly.
3. Last resort: Decider on your laptop GPU behind a secure tunnel, with Express and Bedrock still on EC2. Say so plainly in the article.

---

## 6. UI plan: "The Atlas"

A non-generic UI built as a **celestial atlas**. It is the whole identity: every state (loading, empty, error) is a variation on the same sky, so nothing looks like a stock template.

### 6.1 Design system
- **Palette (CSS variables):** `--ink-900 #070B16`, `--ink-800 #0D1426`, `--ink-700 #141D36`, `--line #2A3556`, `--parchment #E9E2CF`, `--parchment-dim #A9A38F`, `--brass #C9A45C`, `--brass-bright #F0CF85`, `--haze #6F86C9`, `--lichen #7EA77B` (correct), `--ember #E0673A` (errors).
- **Type:** Cormorant Garamond for display, Newsreader for body, IBM Plex Mono for data and numbers. All open-licensed. Self-host with `@fontsource` packages (no third-party requests, no trademark issues).
- **Look:** hairline linework, very fine paper grain on the ink field, thin brass rules, numbered "plates" instead of cards. No gradients, no glassmorphism, no neon, no purple, no card grids, no Inter.
- **Motion:** `motion` library. Short, purposeful: stars igniting, lines drawing, rings expanding. Everything respects `prefers-reduced-motion`.
- **Accessibility:** visible focus rings in brass, contrast checked on the dark field, `aria-live` for race status, every animation has a text equivalent.

### 6.2 Pages
| Route | Name | Purpose |
|---|---|---|
| `/` | **Atlas** | Star chart, query input, Agent Race, decision trace |
| `/almanac` | **Almanac** | Benchmark: Pareto chart, latency, reliability table, failure table |
| `/index` | **Index of Stars** | Browse and search the 240-tool catalog by constellation |
| `/method` | **Method** | How it works, the typed questions, the reusable pattern |
| `*` and errors | **Error screens** | Section 6.7 |

Atlas layout (desktop first):
```
┌────────────────────────────────────────────────────────────┐
│ POLARIS            Atlas · Almanac · Index · Method        │
├───────────────────────────────┬────────────────────────────┤
│                               │  PLATE I: Query            │
│     STAR CHART (SVG)          │  [ ask anything...      ]  │
│     12 constellations         ├────────────────────────────┤
│     240 stars                 │  PLATE II: The Race        │
│                               │  All 240 tools  ▮▮▮▮▮ 38k  │
│                               │  Polaris        ▮ 1.1k     │
│                               ├────────────────────────────┤
│                               │  PLATE III: Decision trace │
└───────────────────────────────┴────────────────────────────┘
```

### 6.3 The star chart (hero)
- Plain SVG. Star positions are **precomputed once** with a force layout and stored in `tools.x, tools.y`, never recalculated at runtime.
- On a query: constellations pulse in proportion to P(category). Shortlisted stars ignite with a ring whose radius equals the confidence. Everything else dims. The final pick gets the **Polaris glow**.
- Hover or tap a star for its name, descriptor and score.

### 6.4 Splash screen: "First Light"
- **Plays on the first visit per session** only (`sessionStorage` flag). Skippable with a click or any key.
- **Sequence (about 2 seconds):** blank ink sky, then stars appear one by one, constellation lines draw between them, the brightest star ignites, and the wordmark "POLARIS" fades in with the tagline "One decision. 240 tools."
- **It is not a fake delay.** While it plays, the app preloads fonts and the catalog (`/api/catalog` or the bundled copy). The splash ends when preload is done **and** a minimum of about 1.2 seconds has passed, with a hard cap of about 3 seconds.
- `prefers-reduced-motion`: a static wordmark with a 400 ms fade.

### 6.5 Loader screens (each tied to a real state)
| Loader | When | Look |
|---|---|---|
| **Charting** (route loader) | Lazy route or data loading | A dim skeleton constellation of dots slowly connecting. No generic spinner. |
| **Calibrating the instrument** | `/api/health` says Decider is still loading its weights | Full-screen loader with an astrolabe ring, a status line ("loading model", "warming up") and polling with backoff. After a timeout it becomes the "offline" screen. |
| **Race stages** | During a race | Each lane shows its true stage: "reading the sky" (Decider), "plotting a course" (Bedrock), "calling the tool", "composing". The token and time counters are live. |
| **Inline** | Buttons and small fetches | A single pulsing star. |

### 6.6 Replay mode (first-class, deterministic)
- Three recorded races (easy, ambiguous, no-tool) are stored as JSON using the **same SSE event schema** and shipped in `web/public/replays/`.
- A replay player feeds the same reducer as the live stream. Benefits: the demo works when the backend is off, you can record the video without spending on Bedrock, and the reducer is easy to test.
- The UI labels replays clearly ("Recorded flight") so nothing is misrepresented.

### 6.7 In-website error pages
One config-driven `<ErrorScreen variant="..." />` component, not separate hand-built pages. Every screen shows a unique constellation SVG, a plain-language explanation, one primary action, and a copyable **request ID** for debugging. Use a global React error boundary plus React Router `errorElement`, and a single `errorMapper` that turns the API error envelope into a variant.

| Variant | Trigger | Title | Primary action |
|---|---|---|---|
| `not_found` (404) | Unknown route | "Off the chart" | Return to the Atlas |
| `server_error` (500) | Unhandled error or boundary | "A star went dark" | Reload, copy request ID |
| `rate_limited` (429) | `RATE_LIMITED` | "Too many readings" | Countdown from `retryAfter`, then retry |
| `budget_exhausted` | `BUDGET_EXHAUSTED` (daily spend kill switch) | "The lamp is out of oil" | Watch a recorded flight |
| `offline_backend` (503) | Health check fails or `DECIDER_UNAVAILABLE` | "The observatory is offline" | Watch a recorded flight, retry |
| `signal_lost` | SSE drops mid-race | "Signal lost" | Auto-retry with backoff, keep partial results, then offer a replay |
| `no_network` | `navigator.onLine` is false | "No signal" | Retry when back online |
| `throttled` | `BEDROCK_THROTTLED` | "Heavy traffic over the sky" | Retry automatically a few times, then show a message |
| inline validation | `BAD_REQUEST` | Field-level message | Fix the input |

**Error envelope (in `packages/contracts`):** `{ error: { code, message, requestId, retryAfter? } }`. Codes: `BAD_REQUEST`, `NOT_FOUND`, `RATE_LIMITED`, `BUDGET_EXHAUSTED`, `DECIDER_UNAVAILABLE`, `BEDROCK_THROTTLED`, `INTERNAL`.

`vercel.json` must rewrite all routes to `index.html`, so deep links reach React Router and the 404 screen works.

### 6.8 Frontend internals
- React + Vite + TypeScript, React Router (data router with `errorElement`), TanStack Query for REST, a custom `useRaceStream` hook (SSE with reconnect), and a `useReducer` race state machine (idle, deciding, racing, done, error).
- Folder: `web/src/{app,pages,components/{chart,race,trace,errors,splash,loaders},hooks,state,styles,lib}`.
- Works against a **mock server and replay JSON** from Day 1, so the frontend branch never waits.

---

## 7. Database (Supabase)

```sql
-- supabase/migrations/0001_init.sql (lives on main, part of the contract commit)
create table tools (
  id text primary key,                 -- e.g. 'calendar.create_event'
  category text not null,
  name text not null,
  description text not null,
  descriptor text not null,            -- <= 12 words, used as a Decider option
  input_schema jsonb not null,
  x real, y real                       -- star-chart position
);

create table eval_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  label_tool text,                     -- null means "no tool needed"
  kind text not null,                  -- direct | paraphrase | ambiguous | no_tool | human
  split text not null                  -- dev | test
);

create table runs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  session_id text not null,
  query text not null,
  created_at timestamptz default now()
);

create table decision_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  stage text not null,                 -- needs_tool | category | tool
  options_count int,
  top jsonb,                           -- [{id, p}]
  confidence real,
  latency_ms int
);

create table lane_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  lane text not null,                  -- baseline | polaris
  tools_sent int,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  chosen_tool text,
  correct boolean,
  est_cost_usd numeric
);

create table bench_runs (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null,               -- model, checkpoint, thresholds, flat|hier
  metrics jsonb not null,              -- accuracy, recall@k, tokens, p50/p95, cost
  created_at timestamptz default now()
);
```

**`database` branch work**
- Migrations beyond `0001` (indexes, RLS policies, a spend-counter table for the kill switch).
- **RLS on every table.** Public `select` only on `tools` and `bench_runs`. Everything else is written by the server with the service-role key, which never reaches the browser.
- `catalog/generate-catalog.ts`: Bedrock generates about 240 **fictional, generically named** tools across about 12 categories (for example `calendar.create_event`, `tickets.open_issue`), each with a description, a 12-word descriptor and an input schema. No real brand names.
- `catalog/generate-queries.ts`: 3 queries per tool (direct, paraphrased, ambiguous) plus about 100 no-tool queries. **Hand-check at least 50 labels and write about 40 queries yourself** (`kind = human`). Split 50/50 into dev and test, and tune only on dev.
- `catalog/layout.ts`: compute star positions once and write them to `tools.x, tools.y`.
- Seed script and `supabase/README.md`.

---

## 8. Backend (Express) and API

**Routes (documented in `docs/api.md` on `main`)**

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | `{ api, decider: loading|ready|down, bedrock }` for the warm-up loader |
| GET | `/api/catalog` | Tools with positions |
| POST | `/api/race` | Start a race. Returns `runId`. |
| GET | `/api/race/:id/stream` | SSE: `decision`, `shortlist`, `lane_start`, `lane_tokens`, `lane_done`, `final`, `error` |
| POST | `/api/route` | Routing only (the reusable surface) |
| GET | `/api/bench/latest` | Benchmark JSON |
| GET | `/api/runs/:id` | Replay a finished race |

**`backend` branch work**
- **B1: router package** (`packages/router`): Decider HTTP client, two-call flow, score combination, tier logic, `thresholds.json`. Unit-test it against recorded Decider responses so tests do not need the model.
- **B2: agent loop:** Bedrock Converse tool-use loop with an injectable tool list, a mock tool executor, and token and latency taken from Bedrock response metadata. Cost is computed from current Bedrock prices (look them up when you run). A CLI `race "query"` for early testing.
- **B3: API and streaming:** Express routes with zod validation, both lanes run **in parallel**, Decider decisions sent over SSE as soon as they exist, persistence after each lane, **request ID middleware**, the error envelope, per-IP rate limit, a **daily spend kill switch**, request timeouts, and Bedrock retry with backoff.
- **B4: benchmark** (`bench/`): three configs, (A) all tools to the LLM, (B) flat Decider top-k, (C) hierarchical and adaptive.
  - Decider-only metrics on **all** test queries (free): recall@1/3/6, tier distribution, p50/p95 latency.
  - End-to-end Bedrock runs on a **sample of about 150** test queries (all-tool prompts are expensive). Use a cheaper model for the benchmark if needed and say which.
  - Report accuracy, recall@k, input tokens, latency, estimated cost per 1,000 requests, the share resolved at tier `direct`, a **reliability table** (confidence bucket vs actual accuracy) and a **failure table**.
  - If you use Bedrock prompt caching on the baseline, report results both ways or state it.
- Authentication is skipped. Secrets come from environment variables and the instance's IAM role.

---

## 9. Deployment

**`deployment` branch work**
- **P1: infra scripts:** `infra/setup.sh` (Python and `strands-decider`, Node, Caddy), `systemd` units `decider.service` and `polaris-api.service` with restart-on-failure, an IAM role with Bedrock invoke permission, a Caddyfile with automatic TLS and **SSE flushing enabled** on the stream route.
- **P2: Vercel:** project config, `vercel.json` SPA rewrite, environment variables for the API base URL, CORS locked on the server to the Vercel domain.
- **P3: pipeline and runbook:** a CI workflow (lint, typecheck, test, build) that runs on every branch, a simple `scripts/deploy.sh` for EC2, and `docs/RUNBOOK.md` covering start, stop, redeploy, logs, and the budget alarm.
- Stop the GPU instance when you are not testing or recording (it bills per hour; check the current price).
- Hostname for TLS: a domain you own, or a free dynamic-DNS subdomain with Caddy's automatic certificates.

---

## 10. Folder structure (final, on `main`)

```
polaris/
├─ LICENSE                      # Apache-2.0
├─ README.md   CHANGELOG.md
├─ package.json                 # npm workspaces
├─ .github/workflows/           # ci.yml, deploy.yml
├─ packages/
│  ├─ contracts/                # zod schemas + types (shared)      [main]
│  └─ router/                   # THE REUSABLE ASSET                [backend]
│     ├─ src/{index,compileCatalog,schema,tiers}.ts
│     ├─ thresholds.json
│     ├─ examples/{bedrock-converse.ts,curl.md}
│     └─ PATTERN.md
├─ server/                      # Express                           [backend]
├─ bench/                       # harness + results                 [backend]
├─ web/                         # React + Vite                      [frontend]
│  └─ public/replays/*.json
├─ supabase/                    # migrations, seed                  [database]
├─ catalog/                     # generators, tools.json, queries   [database]
├─ infra/                       # setup.sh, systemd, Caddyfile      [deployment]
└─ docs/                        # api.md, adr/, RUNBOOK.md, notes.md, article.md
```

---

## 11. Timeline

Day 1 is **Mon Oct 19**. If you start later, you lose buffer, never the submit day.

### Day 1 (Mon Oct 19): contracts, data and the decision
| Block | Branch | Work | Done when |
|---|---|---|---|
| First 30 min | `main` | EC2 GPU quota request, Supabase project, repo with LICENSE, AWS budget alarm | All four exist |
| Next 90 min | `main` | **Contract commit** (section 4.1), tag `v0.0.1-contracts`, create four branches and worktrees | Tag pushed, four branches exist |
| Morning | `backend` | WSL2, serve Decider, run the section 3 verifications | A `choice` question returns per-option probabilities from your script |
| Midday | `database` | Catalog and query generation, hand-check 50 labels, write 40 human queries, load to Supabase | 240 tools and about 800 labelled queries, split fixed |
| Afternoon | `backend` | Router package: hierarchical vs flat, v19 vs v21, recall@k on dev | **Gate:** recall@6 on dev is 85% or more. If not: better descriptors, larger k, or a smaller catalog (about 150). Do not change the project. |
| Evening | `backend` | Bedrock agent loop, mock tools, CLI race | Both lanes print tokens, latency and tool |
| Evening | `deployment` | Launch EC2, install tools, confirm Bedrock access from the instance role | `curl` to Bedrock works from the box |

### Day 2 (Tue Oct 20): API, UI and the first deploy
| Block | Branch | Work | Done when |
|---|---|---|---|
| Morning | `backend` | Express routes, SSE, request IDs, error envelope, rate limit, kill switch, run logging | A race streams events to a plain test page |
| Morning | `frontend` | Vite scaffold, tokens, fonts, **splash**, route loader, error screens (all variants), mock server and replay player | Every error variant is reachable from a dev menu |
| Midday | `frontend` | Star chart with precomputed positions | A replay lights the right constellation |
| Afternoon | `frontend` | Race panel, decision trace, warm-up loader | A full replay animates with live meters |
| Afternoon | `deployment` | systemd units, Caddy, Vercel config, CI | CI is green on all branches |
| Evening | `integration` (disposable) | Merge all four into `integration`, deploy to EC2 and Vercel, test SSE through Caddy | **The Vercel URL runs a live race.** Fix issues in the owning branch. |

### Day 3 (Wed Oct 21): trust, polish and merge
| Block | Branch | Work | Done when |
|---|---|---|---|
| Morning | `backend` | Benchmark harness, tune thresholds on dev, final run on test | Final numbers stored in `bench_runs` |
| Morning | `frontend` | Almanac page (Pareto chart, tables), Index and Method pages | Charts render from stored results |
| Midday | `backend` + `database` | Failure analysis, reliability table, extra hand-written queries for weak cases, RLS review | Failure and reliability tables written up |
| Afternoon | `backend` | `PATTERN.md`, `compileCatalog`, `shortlistTools`, tests | A fresh clone runs the 5-line snippet |
| Afternoon | `frontend` | Polish, accessibility pass, demo queries row, record the three replays | Replays saved in `web/public/replays/` |
| Evening | all | **Feature freeze.** Final merges in the order in section 4.5, CI green, assemble README, CHANGELOG, tag `v1.0.0`, deploy from `main` | `main` deploys cleanly. Rehearse the demo once. |

### Thu Oct 22: submit
| Block | Work |
|---|---|
| Morning | Record the video (use replay mode for a clean take plus one live race), upload publicly |
| Midday | Write and publish the Builder Center article with both tags |
| Afternoon | Repo cleanup, license check, README, ADRs, link everything in **Your project** |
| Evening | Test every link in an incognito window. **Submit.** Stop the GPU instance. |

### Fri Oct 23: buffer only
Fix a broken link or a typo. Nothing new.

### Cut list (cut in this order if you slip)
1. Playwright smoke test and any non-essential tests beyond the core logic tests.
2. Index of Stars page (keep Atlas, Almanac, Method).
3. Run-history replay page.
4. The `needs_tool` question.
5. Hierarchical routing, if flat wins your experiment.

**Never cut:** the race demo, benchmark numbers with the failure table, the reusable package with `PATTERN.md`, replay mode, the splash, loaders and error screens (they are your maintainability and design story), the AWS-hosted backend, the video and the article.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Long-lived branches cause a messy final merge | Contract commit first, folder ownership, `integration` dry run at end of Day 2, merge in dependency order |
| EC2 GPU quota is 0 or slow | Request in the first 30 minutes. Use the placement ladder in section 5. |
| Low recall on large option lists, or 4K-token overflow | Short descriptors, hierarchical routing, larger k, a smaller catalog. A top-k design degrades gracefully. |
| Poor calibration on long option lists | Measure it, set thresholds from your own reliability table, report it |
| Bedrock caps tools per request, or throttles | Check on Day 1, use a 150-tool baseline if needed, retry with backoff, show the `throttled` screen |
| Cost surprise from 240-tool prompts | Budget alarm, a benchmark sample of about 150, a cheaper benchmark model, the spend kill switch, replay mode for demos |
| Synthetic data makes results look too good | Hand-check labels, add 40 human queries, hold out the test split, and say so |
| SSE breaks across origins or proxies | Connect directly to the EC2 hostname, disable buffering in Caddy, test on Day 2 |
| Judge opens the live link after the instance is stopped | Always-on Vercel app with replays and the `offline_backend` screen |
| UI scope creep | Config-driven error screen, one hero chart, three pages minimum, cut list above |
| "Tool selection" is a popular pattern | Win on the Pareto curve, adaptive shortlist, race demo, reusable package, and polish |
| Rules traps | OSI license, public video on an allowed host, no trademarks or copyrighted music, both tags, one entry, submit before the deadline |

---

## 13. The reusable pattern (clearly labelled for the rules)

`packages/router/PATTERN.md` must contain:

1. **Typed questions and option sets:** the `needs_tool` noul question, the `category` choice question with its label list, and the per-category `tool` choice question with the descriptor format. Include the exact JSON request bodies you verified.
2. **The wiring:** `compileCatalog(tools) → catalog.json` (one-time, any LLM writes category labels and 12-word descriptors) and `shortlistTools(query, catalog, { deciderUrl, thresholds }) → { needsTool, tier, tools, decisions }`. Show it in front of a Bedrock Converse call in about 5 lines. Add an HTTP-only recipe with plain `curl` for anyone not using Node.
3. **A short usage note:** when to use it (large tool lists), how to tune `thresholds.json` from your own reliability curve, the 4K-token limit, and known failure modes.

Optional: a Python Strands example, only if the SDK exposes a hook that runs before the model call (verify first).

---

## 14. Demo and presentation strategy

**Video (target 2:45, hard limit under 3:00)**

| Time | Beat |
|---|---|
| 0:00 to 0:10 | The splash, "First Light" (a strong first impression) |
| 0:10 to 0:30 | The problem: 240 tools, tens of thousands of tokens on every request |
| 0:30 to 1:15 | **The race.** Two lanes, same request. Polaris decisions appear first, stars ignite, Polaris finishes while the other lane is still counting. Show the savings line. |
| 1:15 to 1:45 | An **ambiguous** request: lower confidence widens the shortlist from 1 to 6 tools |
| 1:45 to 2:10 | The Almanac: Pareto chart and **one honest failure** |
| 2:10 to 2:30 | One error screen (the "observatory offline" page with the recorded flight), to show the polish |
| 2:30 to 2:45 | The 5-line snippet, the repo link, the license |

Show only measured numbers. No logos, no copyrighted music, captions on. Put the repo and article links in the description.

**Article (Builder Center, "Create post")**
1. The problem: tool overload and what it costs per request.
2. Why this decision should not be generated by an LLM every time.
3. The typed questions and the adaptive shortlist.
4. Results with the Pareto curve, reliability table, and failures.
5. How to reuse it.
6. What I learned, the limits of an experimental 2B model, and next steps.

Use the star chart as the hero image. Tags: `#strands-decider-2b` and `#tool-selection`.

---

## 15. Submission checklist

- [ ] Public repo, Apache-2.0 `LICENSE`, source, README, `packages/router/PATTERN.md`
- [ ] Four branches merged into `main` with merge commits, CI green, `v1.0.0` tagged, `CHANGELOG.md`, ADRs, `RUNBOOK.md`
- [ ] Working agent on AWS (Express on EC2, Bedrock for generation), Decider placement stated honestly
- [ ] Video under 3:00, public on an allowed host, no trademarks or copyrighted music
- [ ] Article published on Builder Center with accuracy, low-confidence handling and measured cost and latency
- [ ] Tags `#strands-decider-2b` and `#tool-selection`
- [ ] Repo, video and article linked in **Your project**
- [ ] One entry only. Builder Center and LinkedIn profiles accurate.
- [ ] Submitted on Thu Oct 22, with Fri Oct 23 as buffer
- [ ] GPU instance stopped and the budget alarm confirmed

## 16. If there is time left

A Python Strands example, a second pattern in the same repo (a `noul` argument guard on the chosen tool), per-category adaptive thresholds, and community-contributed catalogs.
