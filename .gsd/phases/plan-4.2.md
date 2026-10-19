---
phase: 4
plan: 2
wave: 2
gap_closure: false
depends_on: [plan-4.1]
---

# Plan 4.2: Endpoints & Real-Time SSE Streaming Engine

## Objective
Implement Express API endpoints (`GET /api/health`, `GET /api/catalog`, `POST /api/route`) and the live Server-Sent Events (SSE) streaming engine (`POST /api/race`, `GET /api/race/:id/stream`) so the frontend interactive race plates and tool atlas receive real-time telemetry events.

## Context
- `server/src/app.ts`
- `server/src/agent/laneA.ts`
- `server/src/agent/laneB.ts`
- `server/src/agent/pricing.ts`
- `server/src/tools/catalog.json`

## Tasks

<task type="auto">
  <name>Implement Core API Routes (Health, Catalog, Route)</name>
  <files>
    server/src/routes/api.ts
  </files>
  <action>
    Create core route handlers:
    1. `GET /api/health`: Uptime, status, model readiness, version.
    2. `GET /api/catalog`: Returns the 240 tools with category groups and celestial coordinates.
    3. `POST /api/route`: Evaluates a query through `@polaris/router` and returns shortlisted candidates and decision trace.
  </action>
  <verify>
    Curl or Node test against endpoints.
  </verify>
  <done>
    server/src/routes/api.ts serves all catalog and routing endpoints.
  </done>
</task>

<task type="auto">
  <name>Implement Live SSE Race Engine</name>
  <files>
    server/src/sse/raceStream.ts
    server/src/routes/race.ts
  </files>
  <action>
    Implement real-time streaming engine:
    1. Maintain an event emitter hub for active race sessions.
    2. `POST /api/race`: Creates a race job, launches Lane A & Lane B in parallel, emits live stage events (`lane:stage`, `lane:result`, `race:complete`), and records spend to kill-switch tracker.
    3. `GET /api/race/:id/stream`: Sets up SSE connection (`text/event-stream`) streaming events directly to connected browsers.
    4. Provide fallback support for direct synchronous POST response if client prefers polling.
  </action>
  <verify>
    Test SSE stream using test client receiving chunked events.
  </verify>
  <done>
    Live SSE stream delivers millisecond stage transitions for both lanes.
  </done>
</task>

## Must-Haves
- [ ] Working SSE stream on `text/event-stream`.
- [ ] Real-time event dispatches for Lane A and Lane B stages.
- [ ] Catalog endpoint returns all 240 tools.

## Success Criteria
- [ ] Plan committed with `feat(4-2): implement api endpoints and real-time sse race streaming engine`.
