#!/usr/bin/env node
/**
 * Regenerate `supabase/seed.sql` from the generated catalog.
 *
 * Run with `npm run seed --workspace @polaris/catalog`.
 */
import { seedPath, writeSeed } from './generate-seed.js';

async function main(): Promise<void> {
  const result = await writeSeed(seedPath());
  process.stdout.write(`seed        ${result.path} (${result.bytes} bytes)\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`seed generation failed: ${String(error)}\n`);
  process.exitCode = 1;
});
