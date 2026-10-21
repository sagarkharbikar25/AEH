# POLARIS

**One decision. 240 tools.**

POLARIS puts a [Strands Decider 2B](https://github.com/strands-agents) router in front of
Amazon Bedrock Converse. One fast local decision narrows a 240-tool catalog to the 1–6 tools a
request actually needs, and the size of that shortlist is set by Decider's calibrated
confidence. Bedrock only ever sees the shortlisted tools.

Built for the **AWS Strands Decider Agent Hackathon** (`#strands-decider-2b`,
`#tool-selection`).

> The claim is not "an LLM cannot pick from 240 tools". The claim is **similar accuracy at far
> lower token cost and latency**, and every number in this repo is measured. Where a number is
> produced by a simulator, it is labelled as simulated.

## Repository layout

```
polaris/
├─ packages/contracts/   shared zod schemas: SSE events, error envelope, catalog  [main]
├─ packages/router/      the reusable asset: compileCatalog + shortlistTools       [backend]
├─ server/               Express API, SSE, dual-lane agent loop                    [backend]
├─ bench/                benchmark harness and results                              [backend]
├─ web/                  React + Vite "celestial atlas" UI                          [frontend]
├─ supabase/             migrations, RLS, seed                                     [database]
├─ catalog/              tool and query generators                                 [database]
├─ infra/                EC2 setup, systemd, Caddy                                 [deployment]
└─ docs/                 api.md, adr/, RUNBOOK.md, article notes
```

## The reusable pattern

```ts
import { compileCatalog, shortlistTools } from '@polaris/router';

const catalog = compileCatalog(tools);                 // one-time
const { tier, tools: shortlist } = await shortlistTools(query, catalog, { deciderUrl });

const response = await bedrock.converse({ modelId, messages, toolConfig: { tools: shortlist } });
```

The full pattern, the exact Decider request bodies, an HTTP-only `curl` recipe and the known
failure modes live in [`packages/router/PATTERN.md`](packages/router/PATTERN.md).

## Quick start

```bash
npm install                 # npm workspaces
npm run typecheck
npm test
npm run dev:server          # Express API on :3000
npm run dev:web             # Vite app on :5173
```

Environment variables are documented in [`.env.example`](.env.example). No secret is ever
committed.

## Branches

| Branch | Owns | Purpose |
|---|---|---|
| `main` | root, `packages/contracts/`, `docs/api.md`, `docs/adr/` | Contract, CI, final assembly |
| `database` | `supabase/`, `catalog/` | Migrations, RLS, catalog and query generation |
| `backend` | `server/`, `packages/router/`, `bench/` | API, SSE, router, agent loop, benchmark |
| `frontend` | `web/` | The whole UI |
| `deployment` | `infra/`, `vercel.json`, `docs/RUNBOOK.md` | EC2, systemd, Caddy, Vercel, runbook |

## License

Apache-2.0. See [LICENSE](LICENSE).
