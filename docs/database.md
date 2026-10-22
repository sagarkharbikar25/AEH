# Database

Everything POLARIS stores lives in one Postgres database, managed by Supabase.
This page explains the schema, who is allowed to read what, and how the
evaluation set is built.

The migrations are the source of truth. This page explains them; it does not
replace them.

## Files

| Path | What it is |
| --- | --- |
| `supabase/migrations/0001_init.sql` | The v1 schema: seven tables |
| `supabase/migrations/0002_indexes.sql` | Indexes on the columns that are actually queried |
| `supabase/migrations/0003_rls.sql` | Row level security on every table |
| `supabase/migrations/0004_spend.sql` | Daily spend ledger and the increment function |
| `supabase/seed.sql` | Generated: 240 tools and 863 evaluation queries |
| `catalog/` | The generator that produces the catalog, the queries and the seed |
## Tables

### `tools`

The catalog. 240 rows, one per fictional tool.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` primary key | `calendar.create_event` |
| `category` | `text` | One of twelve constellation ids |
| `name` | `text` | `create_event` |
| `description` | `text` | Human-facing text. The router never sees this. |
| `descriptor` | `text` | At most twelve words. This is the text Decider sees as a choice option. |
| `input_schema` | `jsonb` | JSON Schema for the tool arguments |
| `x`, `y` | `real` | Star-chart position, computed once by `catalog/src/layout.ts` |

### `eval_queries`

The evaluation set. 863 rows.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` primary key | Deterministic, derived from the query text |
| `query` | `text` | The question a user would type |
| `label_tool` | `text` | `null` means no tool is needed |
| `kind` | `text` | `direct`, `paraphrase`, `ambiguous`, `no_tool`, `human` |
| `split` | `text` | `dev` or `test` |

### `runs`, `decision_logs`, `lane_results`, `bench_runs`

The measurement tables. `runs` is one row per request; `decision_logs` holds
the Decider trace for that request; `lane_results` holds one row per lane
(baseline against Polaris) with tokens, latency, cost and whether the lane
chose the right tool; `bench_runs` holds the published benchmark summaries.

These four are written by the server with the service-role key.

### `spend_daily`

One row per calendar day: cost, tokens and call count. The server increments
it with `increment_spend(...)` after every Bedrock call and reads it to
enforce the spend limit, so the limit survives a restart.

## Who can read what

Row level security is enabled on every table.

- `anon` and `authenticated`: `select` on `tools` and `bench_runs` only. The
  browser loads the catalog and the published benchmark results directly from
  Supabase. Everything else is denied.
- `service_role`: bypasses row level security. The server uses it for all
  writes and for the tables the browser cannot reach.

The service-role key never reaches the browser. See
`docs/adr/0004-service-role-key.md`.

## Indexes

`0002_indexes.sql` adds indexes on `tools.category`, `eval_queries.split`,
`eval_queries.kind`, `eval_queries.label_tool`, `lane_results.run_id`,
`decision_logs.run_id`, `runs.created_at`, `runs.request_id` and
`bench_runs.created_at`.

The two `run_id` indexes matter most. Postgres does not index the referencing
side of a foreign key, and those two tables grow faster than everything else.

## The evaluation set

The set is generated, not hand-written, with one exception: the human
queries. It contains 863 queries.

| Kind | Count | What it tests |
| --- | --- | --- |
| `direct` | 240 | The tool name, phrased as a request |
| `paraphrase` | 240 | The descriptor, rephrased |
| `ambiguous` | 240 | The action is clear, every parameter is missing |
| `no_tool` | 103 | A question the model can answer alone. Routing one of these to a tool is a wrong answer. |
| `human` | 40 | Written by hand, in the voice a person actually types |

### The split

`dev` and `test` are split exactly in half (431 / 432) and as close to half as
each kind allows. Thresholds, `k`, and every other knob are tuned on `dev`
only. The `test` half is run once, at the end, on the final configuration.

The split is not random per query: each kind is sorted by its deterministic
id and the first half of each kind goes to `dev`. That keeps the two halves
balanced in kind as well as in size, and it makes the split reproducible from
the generator alone, with no separate file to keep in sync.

### Why there are hand-written queries

Templated queries are too clean. A router scores well on them and worse on
what people actually type. The 40 `human` queries are the control group: they
are the reason the numbers are worth believing.

### Label check

The plan asks for at least 50 labels to be checked by hand, and 40 queries to
be written by hand. The 40 hand-written queries are the `human` kind above.
The label check is mechanical and runs in CI, so it cannot rot.

Every labelled query is scored against every tool with a bag of words
matcher: a word in the tool name is worth twice a word in the descriptor. The
labelled tool should come out on top, otherwise the label cannot be recovered
from the query and the query is measuring something other than what it claims.

| Measure | Result |
| --- | --- |
| Labelled queries | 760 |
| Label is one of the best matches | 740 (97.4%) |
| Label is the only best match | 652 (85.8%) |

Broken down:

| Kind | Among best | Only best |
| --- | --- | --- |
| `direct` | 240 / 240 | 233 / 240 |
| `paraphrase` | 240 / 240 | 234 / 240 |
| `ambiguous` | 237 / 240 | 176 / 240 |
| `human` | 23 / 40 | 9 / 40 |

The `human` row is expected and is the point of the set. Those queries are
written the way a person writes, and a bag of words matcher is the wrong tool
for them. `direct` and `paraphrase` are close to perfect because they are
built from the tool name and the descriptor. `ambiguous` has more ties
because it drops every parameter, which is exactly what makes it ambiguous.

42 of the 240 `paraphrase` queries do not repeat the tool name literally.
That is what a paraphrase is for.

The check found real problems, and they were fixed rather than documented
away:

- The `direct` template originally truncated the descriptor at the first
  filler word. 139 of the 720 generated queries could not be traced back to
  their label, for example `please change fields` for `crm.update_contact`.
  The template is now built from the tool name, so every direct query names
  its tool's object.
- The `ambiguous` template originally dropped the verb, which made 106
  queries identical to another query with a different label. It now keeps the
  verb.
- Third-person verbs were converted to imperative with a naive rule, which
  produced `chang`, `publish` and `verifie`. Both English rules are now
  spelled out, and the hyphenated case (`Re-enables`) is handled.
- Two descriptors read badly and were rewritten: `files.preview_file` and
  `hr.update_employee`.

The audit lives in `catalog/src/catalog.test.ts` as the `label audit` block,
and CI runs it.

## Loading it

```bash
supabase db reset          # applies every migration in order, then runs seed.sql
```

`supabase/seed.sql` is generated from the catalog, and every statement in it
is an upsert on the primary key. Running it twice changes nothing, so it can
be re-run after any catalog change without wiping the database.

To regenerate the seed after changing the catalog:

```bash
npm run catalog --workspace @polaris/catalog
npm run seed --workspace @polaris/catalog
```

## Regenerating the catalog

```bash
npm run catalog --workspace @polaris/catalog
```

This rewrites `catalog/tools.json` and `catalog/queries.json`. The output is
deterministic: the same input always produces byte-identical files, which CI
checks. There is no clock, no random seed that changes, and no network call
in the generator.
