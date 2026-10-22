#!/usr/bin/env node
/**
 * POLARIS CLI Race Harness
 *
 * Runs Lane A (All 240 Tools) and Lane B (Polaris Decider Shortlist) in parallel,
 * comparing latency, token consumption, tool fidelity, and enterprise ROI.
 *
 * Usage:
 *   npx tsx src/cli/race.ts "Schedule an urgent incident sync tomorrow at 3pm"
 */

import { runLaneA } from '../agent/laneA.js';
import { runLaneB } from '../agent/laneB.js';
import { calculateSavings } from '../agent/pricing.js';

async function main() {
  const query = process.argv.slice(2).join(' ').trim() ||
    'Schedule a sync meeting with the platform team tomorrow at 2pm';

  console.log('\n================================================================================');
  console.log(' POLARIS RACETRACK · DUAL-LANE BEDROCK CONVERSE EVALUATION');
  console.log('================================================================================');
  console.log(`Prompt: "${query}"`);
  console.log('--------------------------------------------------------------------------------');
  console.log('Firing parallel dual-lane execution (Lane A vs Lane B)...');

  const startTime = Date.now();
  const [laneA, laneB] = await Promise.all([runLaneA(query), runLaneB(query)]);
  const totalWallTime = Date.now() - startTime;

  const savings = calculateSavings(
    { inputTokens: laneA.inputTokens, outputTokens: laneA.outputTokens, durationMs: laneA.latencyMs },
    { inputTokens: laneB.inputTokens, outputTokens: laneB.outputTokens, durationMs: laneB.latencyMs }
  );

  console.log('\n--------------------------------------------------------------------------------');
  console.log(' LANE A: BASELINE (ALL 240 TOOLS IN BEDROCK CONVERSE)');
  console.log('--------------------------------------------------------------------------------');
  console.log(`  Selected Tool   : ${laneA.selectedToolId}`);
  console.log(`  Input Tokens    : ${laneA.inputTokens.toLocaleString()} tokens`);
  console.log(`  Output Tokens   : ${laneA.outputTokens.toLocaleString()} tokens`);
  console.log(`  Total Latency   : ${laneA.latencyMs} ms`);
  console.log(`  Summary Output  : ${laneA.toolExecution.summary}`);
  console.log(`  Stages          :`);
  for (const s of laneA.stages) {
    console.log(`    - ${s.name.padEnd(24)}: ${s.durationMs}ms`);
  }

  console.log('\n--------------------------------------------------------------------------------');
  console.log(' LANE B: POLARIS (DECIDER 2B SHORTLIST -> BEDROCK CONVERSE)');
  console.log('--------------------------------------------------------------------------------');
  console.log(`  Selected Tool   : ${laneB.selectedToolId}`);
  console.log(`  Router Tier     : ${laneB.tier?.toUpperCase()} (${laneB.shortlistCount} candidate tools shortlisted)`);
  console.log(`  Decider Latency : ${laneB.deciderLatencyMs} ms`);
  console.log(`  Bedrock Latency : ${laneB.bedrockLatencyMs} ms`);
  console.log(`  Input Tokens    : ${laneB.inputTokens.toLocaleString()} tokens (Bedrock)`);
  console.log(`  Total Latency   : ${laneB.latencyMs} ms`);
  console.log(`  Summary Output  : ${laneB.toolExecution.summary}`);
  console.log(`  Stages          :`);
  for (const s of laneB.stages) {
    console.log(`    - ${s.name.padEnd(24)}: ${s.durationMs}ms`);
  }

  console.log('\n================================================================================');
  console.log(' POLARIS COMPARATIVE SCOREBOARD');
  console.log('================================================================================');
  console.log(`  Accuracy Parity       : ${laneA.selectedToolId === laneB.selectedToolId ? 'IDENTICAL TOOL MATCH (100% PARITY)' : 'DIFFERENT TOOLS'}`);
  console.log(`  Input Token Reduction : ${laneA.inputTokens.toLocaleString()} -> ${laneB.inputTokens.toLocaleString()} (-${savings.tokenReductionPercent}%)`);
  console.log(`  Execution Speedup     : ${savings.speedupMultiplier}x faster (${laneA.latencyMs}ms -> ${laneB.latencyMs}ms)`);
  console.log(`  Cost Per 10k Requests : $${savings.costPer10kLaneA.toFixed(2)} -> $${savings.costPer10kLaneB.toFixed(2)} (-${savings.savingsPercent}%)`);
  console.log(`  Annual Savings (10k/d): $${savings.annualizedSavingsDollars.toLocaleString()}`);
  console.log(`  Wall Execution Time   : ${totalWallTime} ms`);
  console.log('================================================================================\n');
}

main().catch((err) => {
  console.error('Fatal CLI race error:', err);
  process.exit(1);
});
