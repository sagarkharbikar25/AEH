import { type CompiledCatalog } from './compileCatalog.js';
import { type ShortlistResult, type RouterOptions } from './schema.js';
import { DeciderClient } from './deciderClient.js';

export * from './schema.js';
export * from './compileCatalog.js';
export * from './tiers.js';
export * from './deciderClient.js';

/**
 * Main drop-in entrypoint for POLARIS tool selection.
 * Narrows 240 tools to 1-6 tools in ~40ms before sending to Amazon Bedrock Converse.
 * 
 * @example
 * ```typescript
 * import { compileCatalog, shortlistTools } from "@polaris/router";
 * 
 * const catalog = compileCatalog(rawTools);
 * const { tools, tier, bedrockToolConfig } = await shortlistTools("Schedule team sync tomorrow at 4pm", catalog);
 * ```
 */
export async function shortlistTools(
  prompt: string,
  catalog: CompiledCatalog,
  options: RouterOptions = {}
): Promise<ShortlistResult> {
  const client = new DeciderClient(options);
  return client.route(prompt, catalog);
}
