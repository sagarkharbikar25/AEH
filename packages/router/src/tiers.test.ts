import { describe, it, expect } from 'vitest';
import { determineTier, combineScores, rankAndTierShortlist } from './tiers.js';
import { compileCatalog, formatBedrockConverseTool, revertBedrockToolName } from './compileCatalog.js';
import { Tool } from './schema.js';

describe('Confidence-Adaptive Tier Determination', () => {
  it('assigns direct tier for top score >= 0.85', () => {
    expect(determineTier(0.85, 0.95)).toBe('direct');
    expect(determineTier(0.92, 0.99)).toBe('direct');
  });

  it('assigns narrow tier for 0.55 <= top score < 0.85', () => {
    expect(determineTier(0.84, 0.95)).toBe('narrow');
    expect(determineTier(0.55, 0.80)).toBe('narrow');
  });

  it('assigns wide tier for 0.30 <= top score < 0.55', () => {
    expect(determineTier(0.54, 0.80)).toBe('wide');
    expect(determineTier(0.30, 0.70)).toBe('wide');
  });

  it('assigns fallback tier for top score < 0.30', () => {
    expect(determineTier(0.29, 0.80)).toBe('fallback');
    expect(determineTier(0.10, 0.50)).toBe('fallback');
  });

  it('assigns no_tool tier when needs_tool gate confidence is < 0.25', () => {
    expect(determineTier(0.95, 0.10)).toBe('no_tool');
    expect(determineTier(0.85, 0.24)).toBe('no_tool');
  });
});

describe('Decider 2B Score Multiplication Math', () => {
  it('correctly calculates P(tool) = P(category) * P(tool|category)', () => {
    expect(combineScores(0.90, 0.95)).toBe(0.855);
    expect(combineScores(0.60, 0.70)).toBe(0.42);
    expect(combineScores(0.50, 0.50)).toBe(0.25);
  });
});

describe('Bedrock Converse Tool Formatting & Sanitization', () => {
  const sampleTool: Tool = {
    id: 'calendar.create_event',
    name: 'create_event',
    category: 'calendar',
    descriptor: 'Schedules meeting with participants and room booking',
    description: 'Creates a calendar event and emails invitations',
    parameters: {
      title: { type: 'string', description: 'Event title' },
      startTime: { type: 'string', description: 'ISO 8601 start time' }
    }
  };

  it('sanitizes dots to double-underscores for Amazon Bedrock Converse', () => {
    const formatted = formatBedrockConverseTool(sampleTool);
    expect(formatted.toolSpec.name).toBe('calendar__create_event');
    expect(formatted.toolSpec.inputSchema.json.properties).toHaveProperty('title');
  });

  it('reverts double-underscores back to canonical catalog ID', () => {
    expect(revertBedrockToolName('calendar__create_event')).toBe('calendar.create_event');
  });
});

describe('Catalog Compilation', () => {
  const tools: Tool[] = [
    {
      id: 'calendar.create_event',
      name: 'create_event',
      category: 'calendar',
      descriptor: 'Creates calendar event with time and participants',
      description: 'Long description'
    },
    {
      id: 'storage.upload_object',
      name: 'upload_object',
      category: 'storage',
      descriptor: 'Uploads binary blob or text payload to S3',
      description: 'Long description'
    }
  ];

  it('compiles and indexes tools by ID and category', () => {
    const catalog = compileCatalog(tools);
    expect(catalog.totalTools).toBe(2);
    expect(catalog.toolsById.has('calendar.create_event')).toBe(true);
    expect(catalog.toolsByCategory.get('calendar')).toHaveLength(1);
    expect(catalog.categoryOptions).toHaveProperty('calendar');
    expect(catalog.categoryOptions).toHaveProperty('storage');
  });
});
