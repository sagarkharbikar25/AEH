---
phase: 2
plan: 1
wave: 1
gap_closure: false
depends_on: [plan-1.3]
---

# Plan 2.1: Mock Tool Catalog & Simulated Executor

## Objective
Establish the canonical 240-tool catalog in `server/src/tools/catalog.json` and implement a safe, sandboxed execution harness (`server/src/tools/executor.ts`) that returns structured, realistic JSON execution results for any of the 240 tools without making destructive or external network calls.

## Context
- `packages/router/src/schema.ts`
- `web/src/catalog.ts`
- `plan/final-plan.md`

## Tasks

<task type="auto">
  <name>Export 240 Tools Catalog Seed in server/src/tools/catalog.json</name>
  <files>
    server/src/tools/catalog.json
  </files>
  <action>
    Export all 240 tools across the 12 constellations (Lyra/calendar, Orion/compute, Ursa/storage, Centaurus/database, Cygnus/telemetry, Andromeda/messaging, Cassiopeia/security, Vela/devops, Phoenix/billing, Aquila/tickets, Pegasus/workflows, Draco/network).
    Each tool must have:
    - id (e.g. calendar.create_event)
    - name (create_event)
    - category (calendar)
    - descriptor (<= 12 words)
    - description (full description)
    - parameters schema
    - coordinates (x, y)
  </action>
  <verify>
    Verify JSON parse and total tool count is 240.
  </verify>
  <done>
    server/src/tools/catalog.json contains valid array of 240 tools matching ToolSchema.
  </done>
</task>

<task type="auto">
  <name>Implement Safe Simulated Executor in server/src/tools/executor.ts</name>
  <files>
    server/src/tools/executor.ts
  </files>
  <action>
    Create the sandboxed tool simulator:
    1. Define `executeSimulatedTool(toolId: string, inputArgs: Record<string, any>): ToolExecutionResult`.
    2. Returns:
       - status: 'success' | 'error'
       - toolId: string
       - summary: A concise human-readable summary (e.g. 'Meeting "Team Sync" created successfully for tomorrow 16:00-16:45')
       - data: Structured JSON mock payload appropriate for that tool's category.
       - latencyMs: Simulated realistic execution duration (20-60ms).
    3. Guarantees 100% safe, non-destructive execution.
  </action>
  <verify>
    Run execution check for sample tools across categories.
  </verify>
  <done>
    executor.ts safely handles all 240 tool IDs with realistic returns.
  </done>
</task>

## Must-Haves
- [ ] Exactly 240 tools in catalog.json.
- [ ] Zero real destructive operations or external API calls.
- [ ] Safe simulation with structured JSON results.

## Success Criteria
- [ ] Both tasks committed atomically.
- [ ] summary-2.1.md generated.
