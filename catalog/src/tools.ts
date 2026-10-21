import type { Tool } from '@polaris/contracts';
import { CATEGORY_SEEDS, type CategorySeed, type ToolOp } from './catalog.config.js';
import { buildInputSchema } from './input-schema.js';
import { objectWords } from './naming.js';

/**
 * Build the 240-tool catalog.
 *
 * Every tool is fictional and generically named. The `descriptor` is the
 * short phrase Decider 2B sees; the `description` is the longer human-facing
 * text that never reaches Decider.
 */
export function buildTools(): Tool[] {
  const tools: Tool[] = [];

  for (const category of CATEGORY_SEEDS) {
    for (const [name, descriptor, op] of category.tools) {
      tools.push({
        id: `${category.id}.${name}`,
        name,
        category: category.id,
        descriptor,
        description: buildDescription(category, name, descriptor, op),
        parameters: buildInputSchema(category, op),
      });
    }
  }

  return tools;
}

function buildDescription(
  category: CategorySeed,
  name: string,
  descriptor: string,
  op: ToolOp,
): string {
  const object = objectWords(name);
  const sentence = descriptor.endsWith('.') ? descriptor : `${descriptor}.`;
  const context = `${category.name} constellation.`;
  const behaviour: Record<ToolOp, string> = {
    create: `Creates a new ${object}.`,
    read: `Returns a single ${object} by identifier.`,
    update: `Applies a partial change to an existing ${object}.`,
    delete: `Removes an existing ${object}.`,
    list: `Returns a collection of ${object} records.`,
    search: `Searches ${object} records by keyword.`,
    execute: `Runs an action against an existing ${object}.`,
  };
  return `${sentence} ${behaviour[op]} ${context}`;
}
