import { describe, it, expect } from 'vitest';
import { executeSimulatedTool } from './executor.js';
import catalog from './catalog.json' with { type: 'json' };

describe('Server Tool Catalog & Executor', () => {
  it('catalog contains exactly 240 tools across 12 categories', () => {
    expect(catalog).toBeInstanceOf(Array);
    expect(catalog.length).toBe(240);

    const categories = new Set(catalog.map((t: any) => t.category));
    expect(categories.size).toBe(12);

    for (const tool of catalog) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.descriptor).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
    }
  });

  it('executeSimulatedTool produces safe and realistic output for all 12 categories', () => {
    const sampleTools = [
      'calendar.create_event',
      'compute.launch_instance',
      'storage.write_object',
      'database.execute_read_query',
      'telemetry.get_service_metrics',
      'messaging.send_channel_alert',
      'security.evaluate_iam_policy',
      'devops.trigger_ci_build',
      'billing.get_projected_spend',
      'tickets.create_incident_ticket',
      'workflows.start_execution',
      'network.allocate_elastic_ip',
    ];

    for (const toolId of sampleTools) {
      const res = executeSimulatedTool(toolId, { title: 'Test Item' });
      expect(res.status).toBe('success');
      expect(res.toolId).toBe(toolId);
      expect(res.summary.length).toBeGreaterThan(10);
      expect(res.data).toBeDefined();
      expect(res.latencyMs).toBeGreaterThanOrEqual(20);
      expect(res.latencyMs).toBeLessThanOrEqual(65);
    }
  });
});
