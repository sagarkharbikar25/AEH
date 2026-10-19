---
phase: 4
plan: 1
wave: 1
gap_closure: false
depends_on: [plan-3.2]
---

# Plan 4.1: Express Server & Safety Middleware

## Objective
Establish the production Express application skeleton (`server/src/app.ts`, `server/src/index.ts`) with robust safety guards: CORS for the Vite dev frontend (`http://localhost:5173`), request ID correlation (`x-request-id`), standardized error envelopes, in-memory sliding window rate limiting (60 req/min), and an active spend kill-switch (`BUDGET_EXHAUSTED` at $25.00 limit).

## Context
- `server/package.json`
- `server/src/agent/pricing.ts`
- `server/src/tools/catalog.json`

## Tasks

<task type="auto">
  <name>Implement Safety Middleware (Rate Limit, Kill-Switch, Request ID, Error Envelope)</name>
  <files>
    server/src/middleware/safety.ts
  </files>
  <action>
    Create safety middleware suite:
    1. `requestIdMiddleware`: injects/propagates `x-request-id` UUID header.
    2. `rateLimitMiddleware`: sliding window rate limiter (max 60 req/min per IP/client).
    3. `spendKillSwitchMiddleware`: tracks cumulative estimated dollar spend; if spend exceeds $25.00 (or `MAX_BUDGET_USD` env), immediately short-circuits with HTTP 429 `BUDGET_EXHAUSTED`.
    4. `errorHandler`: catches unhandled errors and renders standard RFC-compliant JSON envelope `{ error: { code, message, requestId } }`.
  </action>
  <verify>
    Write unit test verifying rate limiting and kill-switch behavior.
  </verify>
  <done>
    server/src/middleware/safety.ts provides all required defensive boundaries.
  </done>
</task>

<task type="auto">
  <name>Scaffold Express Server Application</name>
  <files>
    server/src/app.ts
    server/src/index.ts
  </files>
  <action>
    Create `app.ts` exporting configured Express app:
    1. Parse JSON bodies (`express.json({ limit: '1mb' })`).
    2. Configure CORS allowing frontend origins.
    3. Mount safety middleware.
    4. Create `index.ts` starting listener on port `PORT || 3001` with graceful shutdown signal handlers (SIGTERM, SIGINT).
  </action>
  <verify>
    Verify compilation and start server test.
  </verify>
  <done>
    server/src/app.ts and server/src/index.ts ready to mount API routes.
  </done>
</task>

## Must-Haves
- [ ] Unique `x-request-id` attached to every request.
- [ ] Hard stop when cumulative spend hits $25.00.
- [ ] Safe JSON error handling.

## Success Criteria
- [ ] Plan committed with `feat(4-1): implement express server skeleton and safety middleware`.
