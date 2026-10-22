import { describe, expect, it } from 'vitest';

import { CATEGORY_SEEDS } from './catalog.config.js';
import { generateCatalog, serialise } from './generate-catalog.js';
import { buildSeed } from './generate-seed.js';
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './layout.js';

const generated = generateCatalog();

describe('catalog', () => {
  it('has twelve constellations of twenty tools', () => {
    expect(generated.catalog.categories).toHaveLength(12);
    expect(generated.catalog.tools).toHaveLength(240);
    for (const category of CATEGORY_SEEDS) {
      expect(category.tools).toHaveLength(20);
    }
  });

  it('gives every tool a unique id', () => {
    const ids = new Set(generated.catalog.tools.map((tool) => tool.id));
    expect(ids.size).toBe(240);
  });

  it('keeps every descriptor within twelve words', () => {
    for (const tool of generated.catalog.tools) {
      expect(tool.descriptor.split(/\s+/).length).toBeLessThanOrEqual(12);
    }
  });

  it('gives every tool an input schema with at least one required field', () => {
    const opByTool = new Map<string, string>();
    for (const category of CATEGORY_SEEDS) {
      for (const [name, , op] of category.tools) {
        opByTool.set(`${category.id}.${name}`, op);
      }
    }
    for (const tool of generated.catalog.tools) {
      const schema = tool.parameters as { required?: string[] } | undefined;
      expect(schema?.type).toBe('object');
      const op = opByTool.get(tool.id);
      // Listing and searching may take no arguments; every other action does.
      if (op !== 'list' && op !== 'search') {
        expect(schema?.required?.length ?? 0).toBeGreaterThan(0);
      }
      expect(Object.keys((schema?.properties ?? {}) as object).length).toBeGreaterThan(0);
    }
  });

  it('places every star inside the viewport', () => {
    for (const tool of generated.catalog.tools) {
      expect(tool.x).toBeGreaterThanOrEqual(0);
      expect(tool.x).toBeLessThanOrEqual(VIEWPORT_WIDTH);
      expect(tool.y).toBeGreaterThanOrEqual(0);
      expect(tool.y).toBeLessThanOrEqual(VIEWPORT_HEIGHT);
    }
  });

  it('never places two stars on the same spot', () => {
    const spots = new Set(generated.catalog.tools.map((tool) => `${tool.x},${tool.y}`));
    expect(spots.size).toBe(240);
  });
});

describe('evaluation queries', () => {
  it('generates three labelled queries per tool', () => {
    expect(generated.queries.counts.byKind.direct).toBe(240);
    expect(generated.queries.counts.byKind.paraphrase).toBe(240);
    expect(generated.queries.counts.byKind.ambiguous).toBe(240);
  });

  it('includes about a hundred no-tool questions and forty hand-written ones', () => {
    expect(generated.queries.counts.byKind.no_tool).toBeGreaterThanOrEqual(100);
    expect(generated.queries.counts.byKind.human).toBe(40);
  });

  it('splits dev and test evenly', () => {
    expect(generated.queries.counts.bySplit.dev).toBe(
      Math.floor(generated.queries.counts.total / 2),
    );
    expect(generated.queries.counts.bySplit.test).toBe(
      Math.ceil(generated.queries.counts.total / 2),
    );
  });

  it('labels every non no-tool query with a real tool id', () => {
    const toolIds = new Set(generated.catalog.tools.map((tool) => tool.id));
    for (const query of generated.queries.queries) {
      if (query.kind === 'no_tool') {
        expect(query.labelTool).toBeNull();
      } else {
        expect(toolIds.has(query.labelTool ?? '')).toBe(true);
      }
    }
  });

  it('has no duplicate query text', () => {
    const texts = new Set(generated.queries.queries.map((query) => query.query));
    expect(texts.size).toBe(generated.queries.queries.length);
  });
});

describe('label audit', () => {
  /**
   * A mechanical stand-in for checking labels by hand.
   *
   * Every labelled query is scored against every tool with a bag of words
   * matcher: a word in the tool name is worth twice a word in the
   * descriptor. The labelled tool should be the best match, otherwise the
   * label cannot be recovered from the query and the query is measuring
   * something other than what it claims.
   *
   * Human queries are the known exception. They are deliberately written in
   * natural language, and a bag of words matcher is the wrong tool for them.
   */
  it('recovers the label for at least 95% of labelled queries', () => {
    const tools = generated.catalog.tools;
    const sets = new Map(
      tools.map((tool) => [
        tool.id,
        {
          name: new Set(tokens(tool.id.split('.').slice(1).join(' '))),
          descriptor: new Set(tokens(tool.descriptor)),
        },
      ]),
    );

    const labelled = generated.queries.queries.filter((query) => query.labelTool);
    let amongBest = 0;
    let uniqueBest = 0;
    for (const query of labelled) {
      const queryTokens = tokens(query.query);
      const scores = new Map<string, number>();
      let bestScore = -1;
      for (const [id, tool] of sets) {
        let score = 0;
        for (const token of queryTokens) {
          if (tool.name.has(token)) score += 2;
          else if (tool.descriptor.has(token)) score += 1;
        }
        scores.set(id, score);
        if (score > bestScore) bestScore = score;
      }
      const labelScore = scores.get(query.labelTool!)!;
      if (labelScore >= bestScore) amongBest += 1;
      const winners = [...scores.values()].filter((score) => score === bestScore).length;
      if (labelScore === bestScore && winners === 1) uniqueBest += 1;
    }

    // The label must be recoverable for almost every labelled query.
    expect(amongBest / labelled.length).toBeGreaterThanOrEqual(0.95);
    // Most of them must be recoverable without a tie. The ties are in the
    // human set, where two tools share a word and the query is written the
    // way a person writes.
    expect(uniqueBest / labelled.length).toBeGreaterThanOrEqual(0.85);
  });
});

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'of', 'to', 'in', 'on', 'at',
  'for', 'with', 'and', 'or', 'by', 'from', 'as', 'it', 'its', 'this', 'that', 'i', 'me', 'my',
  'you', 'your', 'we', 'our', 'can', 'could', 'would', 'please', 'need', 'want', 'help',
  'some', 'one', 'two', 'all', 'any', 'there', 'their', 'them', 'they', 'he', 'she', 'his',
  'her', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'shall', 'should', 'am', 'into',
  'out', 'up', 'down', 'over', 'about', 'so', 'if', 'not', 'no', 'yes', 'but', 'than', 'then',
]);

function stem(word: string): string {
  let s = word.toLowerCase();
  if (s.endsWith('ies') && s.length > 4) s = `${s.slice(0, -3)}y`;
  else if (s.endsWith('es') && s.length > 4) s = s.slice(0, -2);
  else if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) s = s.slice(0, -1);
  if (s.endsWith('ing') && s.length > 5) s = s.slice(0, -3);
  else if (s.endsWith('ed') && s.length > 4) s = s.slice(0, -2);
  return s;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map(stem);
}

describe('determinism', () => {
  it('produces byte-identical output on a second run', () => {
    const again = generateCatalog();
    expect(serialise(again.catalog)).toBe(serialise(generated.catalog));
    expect(serialise(again.queries)).toBe(serialise(generated.queries));
  });
});

describe('seed', () => {
  const seed = buildSeed();

  it('upserts on the primary key so it can be re-run', () => {
    expect(seed).toContain('on conflict (id) do update set');
    expect(seed.match(/on conflict \(id\) do update set/g)).toHaveLength(2);
    expect(seed.trim().endsWith('commit;')).toBe(true);
  });

  it('inserts every tool and every query exactly once', () => {
    const toolRows = seed.split('\n').filter((line) => line.trim().startsWith("('"));
    expect(toolRows).toHaveLength(240 + generated.queries.counts.total);
    const ids = toolRows.map((line) => line.trim().split("', '")[0]!.slice(2));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mentions no real brand names', () => {
    const brands = [
      'google', 'microsoft', 'amazon', 'aws', 'meta', 'facebook', 'slack', 'notion', 'jira',
      'github', 'gitlab', 'salesforce', 'hubspot', 'stripe', 'shopify', 'gmail', 'outlook',
      'zoom', 'dropbox', 'twitter', 'apple', 'oracle', 'sap', 'atlassian', 'asana', 'trello',
      'workday', 'openai', 'anthropic', 'bedrock', 'zapier', 'salesforce',
    ];
    const text = `${serialise(generated.catalog)}${serialise(generated.queries)}`.toLowerCase();
    for (const brand of brands) {
      const pattern = new RegExp(`\\b${brand}\\b`);
      expect(pattern.test(text)).toBe(false);
    }
  });
});
