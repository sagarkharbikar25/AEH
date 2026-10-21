-- POLARIS v1 schema (contract commit, section 7 of plan/final-plan.md)
--
-- Seven tables. The service-role key writes to everything except `tools` and
-- `bench_runs`, which are readable by the public anon role. RLS policies
-- beyond the initial grants live in migration 0003 (branch: database).

create extension if not exists pgcrypto;

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
