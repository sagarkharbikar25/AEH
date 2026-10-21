# POLARIS API

Base URL: the Express server. In development `http://localhost:3000`, in production the EC2
hostname behind Caddy. Every response is JSON unless noted. Every failure uses the same
error envelope.

## Error envelope

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 12 seconds.",
    "requestId": "req_2f9c1a",
    "retryAfter": 12
  }
}
```

| Code | HTTP | Meaning |
|---|---:|---|
| `BAD_REQUEST` | 400 | The body or a parameter failed validation. `details[]` lists the offending fields. |
| `NOT_FOUND` | 404 | The run, race or benchmark does not exist. |
| `RATE_LIMITED` | 429 | Per-IP limit hit. `retryAfter` holds the seconds to wait. |
| `BUDGET_EXHAUSTED` | 429 | The daily spend ceiling was reached. Stop paying for model calls. |
| `DECIDER_UNAVAILABLE` | 503 | Decider 2B is not answering. The router cannot decide. |
| `BEDROCK_THROTTLED` | 503 | Bedrock throttled the request. `retryAfter` holds the backoff hint. |
| `INTERNAL` | 500 | Unexpected failure. The `requestId` correlates with the server log. |

Every response carries an `x-request-id` header. Send your own `x-request-id` to correlate a
client request with the server log.

## Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Readiness of the API, Decider 2B and Bedrock. Drives the "Calibrating the instrument" loader. |
| `GET` | `/api/catalog` | The 240 tools with their precomputed star-chart positions, grouped into constellations. |
| `POST` | `/api/race` | Start a race. Returns a `runId` and the SSE stream URL. |
| `GET` | `/api/race/:id/stream` | Server-Sent Events for a running race. |
| `POST` | `/api/route` | Routing only. The reusable surface, no model call. |
| `GET` | `/api/bench/latest` | The latest benchmark results. The Almanac renders exactly this. |
| `GET` | `/api/runs/:id` | The full event log of a finished run. Replay source. |

### `GET /api/health`

```json
{
  "api": "up",
  "decider": "ready",
  "bedrock": "connected",
  "version": "1.0.0",
  "uptimeSeconds": 128
}
```

`decider` is `loading` while the model weights are still warming up, `ready` when it answers,
`down` when it does not. `bedrock` is `simulated` when the server runs without AWS credentials
and is producing simulated numbers; the UI labels those as simulated.

### `GET /api/catalog`

```json
{
  "tools": [
    {
      "id": "calendar.create_event",
      "name": "create_event",
      "category": "calendar",
      "descriptor": "Creates a calendar event at a given time",
      "description": "Creates a calendar event for a set of attendees.",
      "parameters": { "type": "object", "properties": {} },
      "x": 412.3,
      "y": 188.7
    }
  ],
  "constellations": [
    { "id": "calendar", "name": "Calendar", "descriptor": "Events, reminders and scheduling", "toolsCount": 20 }
  ]
}
```

### `POST /api/race`

Request:

```json
{ "query": "book a dentist appointment next Tuesday afternoon" }
```

Response `202`:

```json
{
  "runId": "run_6f2a",
  "status": "queued",
  "streamUrl": "/api/race/run_6f2a/stream"
}
```

### `GET /api/race/:id/stream`

`text/event-stream`. Each message is one JSON `RaceEvent` object. The event types are fixed:

| `type` | Emitted when | Payload |
|---|---|---|
| `decision` | Decider answers a question | `stage`, `needsTool`, `confidence`, `latencyMs`, `topCategories` |
| `shortlist` | The shortlist is decided | `tier`, `tools[]`, `totalTools` |
| `lane_start` | A lane starts | `lane`, `toolsSent`, `stage` |
| `lane_tokens` | Token counters tick | `lane`, `inputTokens`, `outputTokens`, `elapsedMs` |
| `lane_done` | A lane finishes | `lane`, token counts, `latencyMs`, `chosenTool`, `correct`, `costUsd` |
| `final` | Both lanes are done | `tier`, `decidedTool`, `laneA`, `laneB`, `savings` |
| `error` | The race fails | `error`, the same envelope as the REST routes |

Every event carries `runId`, a monotonic `seq` and an ISO `ts`.

### `POST /api/route`

Request:

```json
{ "query": "what is the weather" }
```

Response `200`:

```json
{
  "needsTool": false,
  "tier": "no_tool",
  "tools": [],
  "decisions": [
    {
      "stage": "needs_tool",
      "questionId": "needs_tool",
      "answer": "no",
      "confidence": 0.08,
      "latencyMs": 11
    }
  ],
  "latencyMs": 11
}
```

### `GET /api/bench/latest`

Returns the benchmark payload: the three configurations, the Decider-only metrics
(`recallAt1`, `recallAt3`, `recallAt6`, p50/p95 latency, tier distribution, `directShare`), the
reliability table and the failure table. The payload carries a `simulated` flag; the UI must
label the numbers accordingly.

### `GET /api/runs/:id`

Returns the run and its ordered event log, the same shape a recorded flight uses. The web app
feeds both through one reducer.

## Rate limits and budget

`RATE_LIMIT_PER_MINUTE` requests per IP. `MAX_DAILY_BUDGET_USD` per UTC day. When the daily
ceiling is reached the API answers `BUDGET_EXHAUSTED` and refuses to start paid work.
