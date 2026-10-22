---
phase: 1
plan: 1
wave: 1
gap_closure: false
---

# Plan 1.1: Core Types, Zod Schemas & Catalog Compiler

## Objective
Initialize the standalone `@polaris/router` package skeleton, define strictly-typed Zod schemas for Strands Decider 2B SystemOne API calls, and build the Catalog Compiler that clusters 240 tools into 12 constellations with 12-word descriptors fitting inside 4,096 tokens.

## Context
- `.gsd/SPEC.md`
- `plan/final-plan.md`
- `web/src/catalog.ts` (tool catalog definition reference)

## Tasks

<task type="auto">
  <name>Initialize packages/router package.json & tsconfig.json</name>
  <files>
    packages/router/package.json
    packages/router/tsconfig.json
  </files>
  <action>
    Create a clean, isolated TypeScript package for `@polaris/router`:
    1. Define package name `@polaris/router`, version `1.0.0`, license `Apache-2.0`.
    2. Add dependencies: `zod` (^3.22.0).
    3. Add devDependencies: `typescript` (^5.4.0), `@types/node` (^20.11.0).
    4. Configure tsconfig.json with strict typechecking, ES2022 target, NodeNext module resolution, and declaration output.
  </action>
  <verify>
    Test package.json validity and tsconfig syntax.
  </verify>
  <done>
    Valid package.json and tsconfig.json in packages/router/.
  </done>
</task>

<task type="auto">
  <name>Create Zod Schemas & Type Contracts in src/schema.ts</name>
  <files>
    packages/router/src/schema.ts
  </files>
  <action>
    Define strict Zod schemas for:
    1. Decider 2B Question types: `noul` (needs_tool question), `choice` (category or tool choice), `score`.
    2. SystemOne Request & Response shapes:
       - `DeciderSystemOneRequestSchema`: `{ state: string, questions: Record<string, DeciderQuestion> }`.
       - `DeciderSystemOneResponseSchema`: `{ answers: Record<string, DeciderAnswer>, usage: any, latency_ms: number }`.
    3. Tool & Constellation Catalog schemas:
       - `ToolSchema`: id, name, category, descriptor (<= 12 words), description, parameters schema.
       - `ConstellationSchema`: id, name, descriptor.
    4. Shortlist output schema:
       - `ShortlistResultSchema`: `{ tools: Tool[], tier: 'direct'|'narrow'|'wide'|'fallback'|'no_tool', confidence: number, decisionTrace: DecisionTrace }`.
  </action>
  <verify>
    TypeScript compilation without errors.
  </verify>
  <done>
    src/schema.ts exports all Decider 2B schemas and inferred TypeScript types.
  </done>
</task>

<task type="auto">
  <name>Implement Catalog Compiler in src/compileCatalog.ts</name>
  <files>
    packages/router/src/compileCatalog.ts
  </files>
  <action>
    Build the catalog compiler that takes raw tool definitions and compiles them into an optimized index:
    1. Validates each tool against `ToolSchema`.
    2. Groups tools by constellation category (12 categories).
    3. Generates the compact Decider option list for each category (name + 12-word descriptor), ensuring prompt size stays comfortably under Decider 2B's 4,096 token limit.
    4. Exports `compileCatalog(tools: Tool[]): CompiledCatalog`.
  </action>
  <verify>
    Import into a test runner or compile with tsc.
  </verify>
  <done>
    compileCatalog converts raw tools into an indexed, validated structure with lookup tables.
  </done>
</task>

## Must-Haves
- [ ] `packages/router/package.json` has Apache-2.0 license and `@polaris/router` name.
- [ ] Zod schemas strictly model Decider 2B `/v1/systemone` format.
- [ ] `compileCatalog` groups 240 tools into 12 constellations.

## Success Criteria
- [ ] TypeScript compiles cleanly.
- [ ] Plan ready for execution.
