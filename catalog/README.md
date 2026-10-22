# Catalog

The generator for the 240-tool catalog and the labelled evaluation set.

Nothing in here is hand-maintained output. The source of truth is the code,
and the JSON files are artefacts.

## Running it

```bash
npm run catalog --workspace @polaris/catalog   # rewrites tools.json and queries.json
npm run seed --workspace @polaris/catalog      # rewrites ../supabase/seed.sql
npm run test --workspace @polaris/catalog       # 16 tests
```

The output is deterministic. There is no clock, no unseeded random number and
no network call in the generator, so running it twice produces byte-identical
files. CI checks that by regenerating and comparing hashes.

## Files

| File | What it does |
| --- | --- |
| `src/catalog.config.ts` | The 240 tool definitions: twelve constellations of twenty tools, each with a name, a descriptor and an operation |
| `src/input-schema.ts` | The JSON Schema for each tool, derived from the category and the operation |
| `src/tools.ts` | Builds the tool list and the human-facing descriptions |
| `src/naming.ts` | Splits a tool name into verb and object, and spells out the gerunds |
| `src/layout.ts` | The star-chart layout: a seeded force relaxation, run once |
| `src/queries.ts` | The query generator, the no-tool set and the hand-written set |
| `src/generate-catalog.ts` | Puts it together and writes the JSON files |
| `src/generate-seed.ts` | Writes `supabase/seed.sql` from the same data |
| `src/catalog.test.ts` | The tests, including the label audit |

## The rules the catalog follows

**No real brands.** Every tool is fictional and generically named. A test
checks the generated output against a list of well known brand names.

**Descriptors are twelve words or fewer.** The descriptor is the only text
Decider sees as a choice option. A long one costs tokens on every call and
blurs the distinction between tools.

**Descriptions never reach the router.** The `description` field is
human-facing. The router reads `descriptor`.

**Star positions are computed once.** `src/layout.ts` places the twelve
constellations on an ellipse, seeds each tool in a spiral around its hub and
then relaxes the result so that no two stars overlap. The coordinates are
written into `tools.json` and are never recomputed at runtime, so the chart
looks the same on every device and in every replay.

**The queries are labelled by construction.** Every generated query names the
object its tool acts on, so the label can be recovered from the query. The
`label audit` test in `src/catalog.test.ts` checks this on every run.

## The evaluation set

863 queries: 240 direct, 240 paraphrase, 240 ambiguous, 103 no-tool and 40
hand-written.

The hand-written set is the control group. Templated queries are too clean,
so a router scores well on them and worse on what people actually type. See
`docs/database.md` for the label audit and the split.
