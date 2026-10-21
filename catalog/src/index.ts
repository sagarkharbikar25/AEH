#!/usr/bin/env node
/**
 * Regenerate `catalog/tools.json` and `catalog/queries.json`.
 *
 * Run with `npm run catalog`. The output is deterministic, so running it
 * twice must produce byte-identical files. CI checks that.
 */
import { generateCatalog, writeCatalogFiles, catalogDir } from './generate-catalog.js';

async function main(): Promise<void> {
  const generated = generateCatalog();
  const result = await writeCatalogFiles(catalogDir(), generated);

  const { counts } = generated.queries;
  process.stdout.write(
    [
      `catalog      ${generated.catalog.tools.length} tools across ${generated.catalog.categories.length} constellations`,
      `queries      ${counts.total} total (${counts.labelled} labelled, ${counts.unlabelled} unlabelled)`,
      `by kind      ${Object.entries(counts.byKind)
        .sort()
        .map(([kind, n]) => `${kind}=${n}`)
        .join(' ')}`,
      `by split     ${Object.entries(counts.bySplit)
        .sort()
        .map(([split, n]) => `${split}=${n}`)
        .join(' ')}`,
      `written      ${result.toolsPath} (${result.bytes.tools} bytes)`,
      `written      ${result.queriesPath} (${result.bytes.queries} bytes)`,
      '',
    ].join('\n'),
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`catalog generation failed: ${String(error)}\n`);
  process.exitCode = 1;
});
