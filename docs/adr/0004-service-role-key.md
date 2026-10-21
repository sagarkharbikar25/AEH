# ADR 0004: The service-role key never reaches the browser

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** POLARIS team

## Context

Supabase exposes two kinds of client: the `anon` key, which is meant to be public and is
constrained by Row Level Security, and the `service_role` key, which bypasses RLS entirely.
POLARIS writes runs, lane results, decision logs and benchmark runs on every request, and it
reads those rows back to serve `/api/runs/:id`.

The web app is a static bundle on Vercel. Anything in that bundle is readable by anyone who
views the page source.

## Decision

- The **service-role key lives only in the server environment**, supplied by EC2 environment
  configuration. It is never written into the bundle, never sent in a response header and
  never logged.
- The browser talks to the API, never to Supabase, for anything that writes.
- **Row Level Security is enabled on every table.** Public `select` is granted only on
  `tools` and `bench_runs`, which are safe to expose read-only. `runs`, `decision_logs`,
  `lane_results` and `eval_queries` are service-role only.
- The server prefers the Supabase client when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  are configured, and falls back to a local file store when they are not, so development
  never needs a live database.

## Consequences

- A leaked bundle leaks nothing. The worst case is that the anon role can read the public
  catalog, which is the point of it being public.
- RLS policies are part of the migration history, so the security model is reviewable in a
  diff rather than living in application code.
- The browser cannot query the database directly, so every read the UI needs must exist as an
  API route. That is a real cost, and it buys one consistent error envelope and one place
  where request IDs are minted.
- Development works without Supabase credentials, but the file-backed store is a fallback,
  not a second implementation: the repository interface is the same for both.
- `SUPABASE_SERVICE_ROLE_KEY` is in `.env.example` with no value. It must never be committed.
