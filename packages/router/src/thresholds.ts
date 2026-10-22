import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Tier, Tool } from './schema.js';

export interface ThresholdConfig {
  minScore: number;
  toolCount: number;
  includeAskClarification?: boolean;
  description?: string;
}

export const ThresholdConfigSchema = z.object({
  minScore: z.number().min(0).max(1),
  toolCount: z.number().int().nonnegative(),
  includeAskClarification: z.boolean().optional(),
  description: z.string().optional(),
});

export const ThresholdsFileSchema = z.object({
  version: z.string(),
  model: z.string(),
  thresholds: z.object({
    direct: ThresholdConfigSchema,
    narrow: ThresholdConfigSchema,
    wide: ThresholdConfigSchema,
    fallback: ThresholdConfigSchema,
  }),
  noToolGateThreshold: z.number().min(0).max(1),
});

export type ThresholdsFile = z.infer<typeof ThresholdsFileSchema>;

export const DEFAULT_THRESHOLDS: Record<Tier, ThresholdConfig> = {
  direct: { minScore: 0.85, toolCount: 1, description: 'Single high-confidence tool match sent directly to Bedrock' },
  narrow: { minScore: 0.55, toolCount: 3, description: 'Narrow shortlist of 3 tools for Bedrock parameter resolution' },
  wide: { minScore: 0.30, toolCount: 6, description: 'Wide shortlist of 6 tools for ambiguous cross-cutting requests' },
  fallback: { minScore: 0.0, toolCount: 12, includeAskClarification: true, description: 'Low-confidence fallback sent with clarification tool' },
  no_tool: { minScore: 0.0, toolCount: 0, description: 'Zero-tool baseline for chit-chat or general knowledge' },
};

export const DEFAULT_NO_TOOL_GATE_THRESHOLD = 0.25;

export const ASK_CLARIFICATION_TOOL: Tool = {
  id: 'ask_clarification',
  name: 'ask_clarification',
  category: 'fallback',
  descriptor: 'Prompt user for additional details when intent is ambiguous',
  description: 'Asks the user a clarifying question when intent is ambiguous, multiple tools apply equally, or required parameters are absent.',
  parameters: {
    question: {
      type: 'string',
      description: 'The clarifying question to present to the user',
      required: true,
    },
  },
};

/**
 * Loads and validates thresholds.json from the package directory or given path.
 * Falls back to DEFAULT_THRESHOLDS if file cannot be read.
 */
export function loadThresholds(customPath?: string): {
  thresholds: Record<Tier, ThresholdConfig>;
  noToolGateThreshold: number;
} {
  try {
    let filePath = customPath;
    if (!filePath) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      filePath = path.resolve(__dirname, '../thresholds.json');
    }

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = ThresholdsFileSchema.parse(JSON.parse(raw));

      return {
        thresholds: {
          direct: parsed.thresholds.direct,
          narrow: parsed.thresholds.narrow,
          wide: parsed.thresholds.wide,
          fallback: parsed.thresholds.fallback,
          no_tool: DEFAULT_THRESHOLDS.no_tool,
        },
        noToolGateThreshold: parsed.noToolGateThreshold,
      };
    }
  } catch (err) {
    console.warn('[PolarisRouter] Warning: failed to load thresholds.json, using defaults.', err);
  }

  return {
    thresholds: DEFAULT_THRESHOLDS,
    noToolGateThreshold: DEFAULT_NO_TOOL_GATE_THRESHOLD,
  };
}
