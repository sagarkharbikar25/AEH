-- POLARIS migration 0003: row level security
--
-- The public browser talks to Supabase directly for two tables only: the
-- catalog (`tools`) and published benchmark results (`bench_runs`). Both are
-- read-only for the public role.
--
-- Everything else is written and read by the server using the service-role
-- key. The service role bypasses row level security, so no policy is needed
-- for it; the policies below exist to make sure the `anon` and
-- `authenticated` roles cannot read or write anything else.
--
-- This is the isolation described in docs/adr/0004-service-role-key.md.

alter table tools enable row level security;
alter table eval_queries enable row level security;
alter table runs enable row level security;
alter table decision_logs enable row level security;
alter table lane_results enable row level security;
alter table bench_runs enable row level security;

revoke all on tools from anon, authenticated;
revoke all on eval_queries from anon, authenticated;
revoke all on runs from anon, authenticated;
revoke all on decision_logs from anon, authenticated;
revoke all on lane_results from anon, authenticated;
revoke all on bench_runs from anon, authenticated;

grant select on tools to anon, authenticated;
grant select on bench_runs to anon, authenticated;

drop policy if exists "tools are world readable" on tools;
create policy "tools are world readable"
  on tools
  for select
  to anon, authenticated
  using (true);

drop policy if exists "bench runs are world readable" on bench_runs;
create policy "bench runs are world readable"
  on bench_runs
  for select
  to anon, authenticated
  using (true);
