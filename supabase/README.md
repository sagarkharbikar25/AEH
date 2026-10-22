# Supabase

Migrations and seed data for the POLARIS database.

## Layout

```
supabase/
  migrations/
    0001_init.sql      the v1 schema
    0002_indexes.sql   indexes
    0003_rls.sql       row level security
    0004_spend.sql     daily spend ledger
  seed.sql             generated: 240 tools, 863 evaluation queries
  README.md            this file
```

Migrations run in filename order and are never edited after they have been
applied. A change to an applied migration is a new migration.

## Requirements

- The Supabase CLI: https://supabase.com/docs/guides/cli
- Docker, which the CLI uses to run a local Postgres

```bash
supabase start
supabase db reset
```

`db reset` drops the local database, applies every migration in order, and
then runs `seed.sql`. It is the fastest way to get a clean database.

To apply migrations to a remote project:

```bash
supabase link --project-ref <ref>
supabase db push
supabase db execute --file supabase/seed.sql
```

## The seed is idempotent

`seed.sql` is generated from the catalog, and every statement in it is an
upsert on the primary key. Running it twice changes nothing. So after a
catalog change you can regenerate and re-apply the seed without wiping
anything:

```bash
npm run catalog --workspace @polaris/catalog
npm run seed --workspace @polaris/catalog
supabase db execute --file supabase/seed.sql
```

## Keys

Two keys matter, and they must never be confused.

| Key | Where it lives | What it can do |
| --- | --- | --- |
| `anon` | in the browser, via `NEXT_PUBLIC_*` | Read `tools` and `bench_runs`. Nothing else. |
| `service_role` | in the server environment only | Everything. It bypasses row level security. |

The service-role key is never sent to the browser. See
`docs/adr/0004-service-role-key.md`.

## Verifying the row level security

After `db reset`, check that the public role really is limited:

```bash
# this works: tools are public
curl "$SUPABASE_URL/rest/v1/tools?select=id&limit=1" -H "apikey: $ANON_KEY"

# this fails: the evaluation set is not public
curl "$SUPABASE_URL/rest/v1/eval_queries?select=id&limit=1" -H "apikey: $ANON_KEY"
```

The second request must return a permission error. If it returns rows, the
policies in `0003_rls.sql` are wrong.
