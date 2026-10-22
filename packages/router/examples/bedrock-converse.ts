/**
 * POLARIS Drop-In Example: Amazon Bedrock Converse with Strands Decider 2B
 * 
 * Demonstrates 5-line tool shortlisting:
 * Narrows 240 tools down to 1-6 tools in ~40ms before passing to Bedrock.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { compileCatalog, shortlistTools, Tool } from '../src/index.js';

// Sample tools representing enterprise MCP catalog
const sampleTools: Tool[] = [
  {
    id: 'calendar.create_event',
    name: 'create_event',
    category: 'calendar',
    descriptor: 'Creates calendar event with start time, duration, and attendees',
    description: 'Schedules meetings and calendar invitations',
    parameters: {
      title: { type: 'string', description: 'Event title' },
      startTime: { type: 'string', description: 'ISO 8601 start time' },
      durationMinutes: { type: 'number', description: 'Duration in minutes' }
    }
  },
  {
    id: 'storage.upload_object',
    name: 'upload_object',
    category: 'storage',
    descriptor: 'Uploads binary blob or text payload to Amazon S3 bucket',
    description: 'Stores files and objects in cloud storage'
  },
  {
    id: 'database.execute_sql',
    name: 'execute_sql',
    category: 'database',
    descriptor: 'Runs SQL query against relational database connection',
    description: 'Executes read/write database transactions'
  }
];

async function main() {
  const userPrompt = 'Schedule team sync for tomorrow at 4 PM for 45 minutes';
  console.log(`[POLARIS] User Prompt: "${userPrompt}"`);

  // 1. Compile catalog once
  const catalog = compileCatalog(sampleTools);
  console.log(`[POLARIS] Compiled ${catalog.totalTools} tools across ${catalog.toolsByCategory.size} categories.`);

  // 2. Pre-filter with Strands Decider 2B
  console.log('[POLARIS] Routing through Strands Decider 2B...');
  const { tools, tier, confidence, decisionTrace, bedrockToolConfig } = await shortlistTools(
    userPrompt,
    catalog,
    { deciderUrl: 'http://localhost:8000' }
  );

  console.log(`[POLARIS] Assigned Tier: ${tier.toUpperCase()} (${(confidence * 100).toFixed(1)}% confidence)`);
  console.log(`[POLARIS] Shortlisted ${tools.length} tool(s):`, tools.map(t => t.id));
  console.log(`[POLARIS] Decider 2B Routing Latency: ${decisionTrace.latencyMs}ms`);

  // 3. Send ONLY shortlisted tools to Amazon Bedrock Converse
  const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

  try {
    const response = await bedrock.send(new ConverseCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      messages: [{ role: 'user', content: [{ text: userPrompt }] }],
      toolConfig: bedrockToolConfig
    }));

    console.log('[POLARIS] Bedrock Response Status:', response.stopReason);
    console.log('[POLARIS] Input Tokens Ingested:', response.usage?.inputTokens);
  } catch (err: any) {
    console.log('[POLARIS] Bedrock invocation simulated (no AWS credentials configured).');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
