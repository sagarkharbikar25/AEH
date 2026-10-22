import { describe, it, expect } from 'vitest';
import { callBedrockConverse } from './bedrock.js';
import { calculateTokenCost, calculateSavings } from './pricing.js';

describe('Plan 3.1: Bedrock Client & Cost Estimator', () => {
  it('calculates token costs correctly for Claude 3 Haiku and Nova Micro', () => {
    // 20,400 input tokens, 72 output tokens on Claude 3 Haiku ($0.25/1M in, $1.25/1M out)
    const costLaneA = calculateTokenCost('anthropic.claude-3-haiku-20240307-v1:0', 20400, 72);
    expect(costLaneA).toBeGreaterThan(0.005);
    expect(costLaneA).toBeLessThan(0.006); // ~0.00519

    // 400 input tokens, 72 output tokens on Claude 3 Haiku
    const costLaneB = calculateTokenCost('anthropic.claude-3-haiku-20240307-v1:0', 400, 72);
    expect(costLaneB).toBeLessThan(0.0003); // ~0.00019
  });

  it('computes savings comparison between Lane A and Lane B', () => {
    const savings = calculateSavings(
      { inputTokens: 20400, outputTokens: 72, durationMs: 1240 },
      { inputTokens: 410, outputTokens: 72, durationMs: 210, deciderTokens: 420 },
      'anthropic.claude-3-haiku-20240307-v1:0',
      10000
    );

    expect(savings.tokenReductionPercent).toBeGreaterThan(95);
    expect(savings.speedupMultiplier).toBeGreaterThan(4.5);
    expect(savings.costPer10kLaneA).toBeGreaterThan(50);
    expect(savings.costPer10kLaneB).toBeLessThan(5);
    expect(savings.savingsPercent).toBeGreaterThan(90);
    expect(savings.annualizedSavingsDollars).toBeGreaterThan(15000);
  });

  it('callBedrockConverse runs in simulated mode with realistic token scaling', async () => {
    // 1. Call with tiny shortlist (4 tools)
    const tinyTools = [
      { toolSpec: { name: 'calendar__create_event', description: 'Creates event', inputSchema: { json: {} } } },
      { toolSpec: { name: 'calendar__find_free_slots', description: 'Finds free slots', inputSchema: { json: {} } } },
      { toolSpec: { name: 'calendar__delete_event', description: 'Deletes event', inputSchema: { json: {} } } },
      { toolSpec: { name: 'calendar__book_room', description: 'Books room', inputSchema: { json: {} } } },
    ];

    const resB = await callBedrockConverse({
      messages: [{ role: 'user', content: [{ text: 'Schedule a sync meeting with the product team tomorrow at 2pm' }] }],
      toolConfig: { tools: tinyTools },
    });

    expect(resB.stopReason).toBe('tool_use');
    expect(resB.usage.inputTokens).toBeLessThan(600);
    expect(resB.latencyMs).toBeLessThan(350);

    const toolUseBlock = resB.output.message.content.find((c) => c.toolUse);
    expect(toolUseBlock?.toolUse?.name).toBe('calendar__create_event');
  });
});
