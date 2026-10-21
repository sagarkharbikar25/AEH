-- POLARIS migration 0002: indexes
--
-- The foreign keys on `lane_results.run_id` and `decision_logs.run_id` point
-- at `runs(id)`, but Postgres does not index the referencing side of a
-- foreign key. Without these, every "show me the trace for this run" query
-- degrades into a sequential scan of the log tables, which are the two
-- fastest-growing tables in the system.

create index if not exists idx_tools_category on tools (category);

create index if not exists idx_eval_queries_split on eval_queries (split);
create index if not exists idx_eval_queries_kind on eval_queries (kind);
create index if not exists idx_eval_queries_label_tool
  on eval_queries (label_tool)
  where label_tool is not null;

create index if not exists idx_lane_results_run_id on lane_results (run_id);
create index if not exists idx_decision_logs_run_id on decision_logs (run_id);

create index if not exists idx_runs_created_at on runs (created_at desc);
create index if not exists idx_bench_runs_created_at on bench_runs (created_at desc);
create index if not exists idx_runs_request_id on runs (request_id);
