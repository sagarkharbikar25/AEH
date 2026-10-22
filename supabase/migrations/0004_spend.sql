-- POLARIS migration 0004: daily spend ledger
--
-- The kill switch. Bedrock spend has to be capped, and a cap that is only
-- checked against an in-process counter resets every time the server
-- restarts. The counter of record is one row per day.
--
-- The server calls `increment_spend` after every model call and reads
-- `spend_daily` to decide whether to stop. `spend_limit_usd` lives in the
-- server configuration; this table only records what has been spent.

create table spend_daily (
  day date primary key,
  cost_usd numeric(12, 6) not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  calls int not null default 0,
  updated_at timestamptz not null default now()
);

alter table spend_daily enable row level security;

revoke all on spend_daily from anon, authenticated;

create or replace function increment_spend(
  p_cost_usd numeric,
  p_input_tokens bigint,
  p_output_tokens bigint
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into spend_daily (day, cost_usd, input_tokens, output_tokens, calls)
  values (current_date, coalesce(p_cost_usd, 0), coalesce(p_input_tokens, 0), coalesce(p_output_tokens, 0), 1)
  on conflict (day) do update
    set cost_usd = spend_daily.cost_usd + coalesce(p_cost_usd, 0),
        input_tokens = spend_daily.input_tokens + coalesce(p_input_tokens, 0),
        output_tokens = spend_daily.output_tokens + coalesce(p_output_tokens, 0),
        calls = spend_daily.calls + 1,
        updated_at = now();
end;
$$;

comment on table spend_daily is
  'One row per calendar day. The server increments it after every Bedrock call and reads it to enforce the spend limit.';
