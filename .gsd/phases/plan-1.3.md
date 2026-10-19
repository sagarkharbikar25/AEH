---
phase: 1
plan: 3
wave: 3
gap_closure: false
depends_on: [plan-1.1, plan-1.2]
---

# Plan 1.3: Reusable Pattern Documentation & Bedrock Converse Example

## Objective
Author the standalone `PATTERN.md` documentation explaining the two-call hierarchical Decider 2B pattern for the AWS Strands Decider Agent Hackathon, and provide a self-contained 5-line integration example (`examples/bedrock-converse.ts`).

## Context
- `plan/final-plan.md`
- `packages/router/src/index.ts`
- `packages/router/thresholds.json`

## Tasks

<task type="auto">
  <name>Write PATTERN.md architectural documentation</name>
  <files>
    packages/router/PATTERN.md
  </files>
  <action>
    Author PATTERN.md detailing:
    1. Problem Statement: Tool Schema Bloat in LLM agents with 100+ tools.
    2. The Solution: Strands Decider 2B Hierarchical Router.
    3. Mathematical Formulation: P(tool) = P(category) * P(tool|category).
    4. Adaptive Tiering table and thresholds.
    5. Token & Latency harvest comparison.
    6. How to install and reuse @polaris/router.
  </action>
  <verify>
    Ensure Markdown renders properly with clear headings and code blocks.
  </verify>
  <done>
    PATTERN.md ready as the hackathon submission reusable asset.
  </done>
</task>

<task type="auto">
  <name>Create drop-in example in examples/bedrock-converse.ts</name>
  <files>
    packages/router/examples/bedrock-converse.ts
  </files>
  <action>
    Create a standalone executable TypeScript example:
    1. Imports BedrockRuntimeClient and ConverseCommand from @aws-sdk/client-bedrock-runtime.
    2. Imports compileCatalog and shortlistTools from @polaris/router.
    3. Compiles sample tools and passes shortlisted tools into ConverseCommand.
    4. Prints input token count, latency, and returned message.
  </action>
  <verify>
    Verify TypeScript syntax.
  </verify>
  <done>
    examples/bedrock-converse.ts provides working drop-in code snippet.
  </done>
</task>

## Must-Haves
- [ ] PATTERN.md covers hierarchical routing and confidence adaptation.
- [ ] examples/bedrock-converse.ts demonstrates 5-line integration.

## Success Criteria
- [ ] Phase 1 complete and committed.
- [ ] summary-1.3.md generated.
