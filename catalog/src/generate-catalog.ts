import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Constellation, Tool } from '@polaris/contracts';

import { CATEGORY_SEEDS } from './catalog.config.js';
import { layoutCatalog } from './layout.js';
import { generateQueries, type EvalQuery, type QueryKind, type QuerySplit } from './queries.js';
import { buildTools } from './tools.js';

export const CATALOG_VERSION = '1.0.0';

export interface CatalogFile {
  version: string;
  categories: Array<{ id: string; name: string; descriptor: string; toolsCount: number }>;
  constellations: Constellation[];
  tools: Tool[];
}

export interface QueriesFile {
  version: string;
  counts: {
    total: number;
    byKind: Record<string, number>;
    bySplit: Record<string, number>;
    labelled: number;
    unlabelled: number;
  };
  queries: EvalQuery[];
}

export interface GeneratedCatalog {
  catalog: CatalogFile;
  queries: QueriesFile;
}

/**
 * Build the whole catalog and query set in memory.
 *
 * Nothing here touches the clock, the network or the file system, so the
 * result is identical on every machine. That is the point: the benchmark and
 * the browser must be looking at the same 240 tools.
 */
export function generateCatalog(): GeneratedCatalog {
  const rawTools = buildTools();
  const { tools, constellations } = layoutCatalog(rawTools);
  const queries = generateQueries(tools);

  const byKind: Record<string, number> = {};
  const bySplit: Record<string, number> = {};
  let labelled = 0;
  for (const query of queries) {
    byKind[query.kind] = (byKind[query.kind] ?? 0) + 1;
    bySplit[query.split] = (bySplit[query.split] ?? 0) + 1;
    if (query.labelTool) labelled += 1;
  }

  return {
    catalog: {
      version: CATALOG_VERSION,
      categories: CATEGORY_SEEDS.map((category) => ({
        id: category.id,
        name: category.name,
        descriptor: category.descriptor,
        toolsCount: category.tools.length,
      })),
      constellations,
      tools,
    },
    queries: {
      version: CATALOG_VERSION,
      counts: {
        total: queries.length,
        byKind,
        bySplit,
        labelled,
        unlabelled: queries.length - labelled,
      },
      queries,
    },
  };
}

/** Serialise with a stable key order and a trailing newline. */
export function serialise(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export interface WriteResult {
  toolsPath: string;
  queriesPath: string;
  bytes: { tools: number; queries: number };
}

export async function writeCatalogFiles(root: string, generated: GeneratedCatalog): Promise<WriteResult> {
  const toolsPath = resolve(root, 'tools.json');
  const queriesPath = resolve(root, 'queries.json');
  await mkdir(dirname(toolsPath), { recursive: true });

  const toolsBody = serialise(generated.catalog);
  const queriesBody = serialise(generated.queries);
  await writeFile(toolsPath, toolsBody, 'utf8');
  await writeFile(queriesPath, queriesBody, 'utf8');

  return {
    toolsPath,
    queriesPath,
    bytes: { tools: Buffer.byteLength(toolsBody), queries: Buffer.byteLength(queriesBody) },
  };
}

/** Directory that holds the generated artefacts, resolved from this module. */
export function catalogDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

export type { EvalQuery, QueryKind, QuerySplit };
