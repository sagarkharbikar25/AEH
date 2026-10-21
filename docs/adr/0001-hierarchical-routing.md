# ADR 0001: Hierarchical routing over a flat choice

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** POLARIS team

## Context

Decider 2B takes a `state` string and a set of typed questions. To pick a tool out of a
240-tool catalog it must either see all 240 options in one `choice` question, or see them in
smaller groups.

Three facts constrain the design:

1. The Decider context window is **4 096 tokens**. Every option descriptor consumes part of it.
2. Decider is experimental. Its own published benchmark sits near 72%, so a hard one-shot gate
   over 240 options would fail a large share of real requests.
3. The plan is honest about the claim: *similar accuracy at far lower tokens and latency*, not
   an accuracy gain over the LLM.

A flat `choice` over all 240 tool names is roughly 2.5K tokens of options on its own, it asks
the small model to discriminate across 240 near-identical labels, and it has no way to express
"none of these". A hierarchical scheme asks two easier questions in two cheap calls.

## Decision

Use **two calls to `POST /v1/systemone`**.

1. **Call 1** carries the user request as `state` and asks two questions in one request:
   `needs_tool` (a `noul` question) and `category` (a `choice` question over about 12
   categories).
2. **Call 2** carries the same `state` and asks one `tool` `choice` question **per top-2
   category**, listing only that category's tools with a descriptor of 12 words or fewer.

Scores combine as `P(category) × P(tool | category)`. The top-k by combined score becomes the
shortlist, and the top-1 score picks the tier.

The flat variant is still implemented and measured as **config B** in the benchmark, so the
choice between them is made on recall@k and latency rather than on taste. `config C` is the
hierarchical adaptive variant that ships.

## Consequences

- The option list per question stays inside the 4 096-token budget, which is what makes the
  two-call flow safe.
- Two small calls cost more than one big call, and the second call is conditional on the
  first. The measured latency is in `bench/results.json`; the plan reports it honestly.
- The category taxonomy becomes part of the contract. The catalog compiler owns it, and
  `compileCatalog` is the one place that assigns a tool to a category.
- The score is a product of two independent estimates, so it is not a calibrated probability.
  That is why the tier thresholds are measured against a reliability table rather than assumed.
- `needs_tool` lets a request that needs no tool at all send **zero** tools to Bedrock, which
  is the cheapest possible outcome.
- The flat variant stays in the codebase as a benchmark config, so the experiment can be
  reproduced instead of argued about.
