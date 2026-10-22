import { type Tool, ToolSchema } from './schema.js';

export interface CompiledCatalog {
  /** Map of tool ID -> full Tool record */
  toolsById: Map<string, Tool>;
  
  /** Map of category ID -> array of Tools belonging to that constellation */
  toolsByCategory: Map<string, Tool[]>;
  
  /** Formatted options dictionary for Decider Call 1: category ID -> 12-word category descriptor */
  categoryOptions: Record<string, string>;
  
  /** Formatted options dictionary for Decider Call 2: category ID -> (tool ID -> 12-word tool descriptor) */
  toolOptionsByCategory: Record<string, Record<string, string>>;
  
  /** Flattened list of all validated tools */
  allTools: Tool[];
  
  /** Total count of tools in compiled catalog */
  totalTools: number;
}

/**
 * Standard constellation descriptions for Decider 2B SystemOne Call 1
 */
export const DEFAULT_CONSTELLATION_DESCRIPTORS: Record<string, string> = {
  calendar: 'Event scheduling, calendar invites, free slots, timezones, room bookings',
  compute: 'Server instances, containers, CPU scaling, VM lifecycle, cluster jobs',
  storage: 'S3 buckets, file uploads, presigned URLs, lifecycle policies, archives',
  database: 'SQL queries, table migrations, connection pools, schema backups, indexes',
  telemetry: 'Metrics dashboards, alerting rules, query traces, latency telemetry, logs',
  messaging: 'Slack messages, email delivery, SMS notices, webhook broadcasts, threads',
  security: 'IAM permissions, KMS secrets, API keys, audit trails, certificate renews',
  devops: 'Git deployments, CI pipelines, rollback triggers, container builds, tests',
  billing: 'Cost budgets, invoice generation, credit usage, payment cards, usage alerts',
  tickets: 'Issue triage, Jira tickets, SLA tracking, sprint boards, bug escalations',
  analytics: 'User cohort metrics, conversion funnels, event tracking, churn reports',
  network: 'DNS routing, VPC subnets, ingress firewall, load balancers, CDN purge',
  workflows: 'Automation, triggers, action steps, approvals and scheduled workflows',
  files: 'Document storage, folders, sharing, archives, metadata and scanning',
  crm: 'Customer contacts, leads, accounts, deals, pipeline and sales activity',
  inventory: 'Stock levels, warehouses, purchase orders, catalog products and shipments',
  hr: 'Employee records, leave, attendance, payroll, benefits and onboarding',
  identity: 'User accounts, roles, access permissions, API tokens and auth sessions',
  knowledge: 'Wiki pages, articles, documentation spaces, revisions and search',
};

/**
 * Compiles a raw list of tools into an indexed, validated catalog structure.
 * Validates that descriptors fit within Decider 2B prompt budgets.
 */
export function compileCatalog(rawTools: Tool[]): CompiledCatalog {
  const toolsById = new Map<string, Tool>();
  const toolsByCategory = new Map<string, Tool[]>();
  const toolOptionsByCategory: Record<string, Record<string, string>> = {};
  const validTools: Tool[] = [];

  for (const raw of rawTools) {
    const tool = ToolSchema.parse(raw);
    toolsById.set(tool.id, tool);
    validTools.push(tool);

    if (!toolsByCategory.has(tool.category)) {
      toolsByCategory.set(tool.category, []);
      toolOptionsByCategory[tool.category] = {};
    }

    toolsByCategory.get(tool.category)!.push(tool);

    // Clean descriptor: ensure <= 12 words for Decider prompt efficiency
    const words = tool.descriptor.split(/\s+/).filter(Boolean);
    const compactDescriptor = words.length > 12 
      ? words.slice(0, 12).join(' ') 
      : tool.descriptor;

    toolOptionsByCategory[tool.category][tool.id] = compactDescriptor;
  }

  // Build category options dictionary for Call 1
  const categoryOptions: Record<string, string> = {};
  for (const category of toolsByCategory.keys()) {
    categoryOptions[category] = DEFAULT_CONSTELLATION_DESCRIPTORS[category] || 
      `${category} subsystem operations and tools`;
  }

  return {
    toolsById,
    toolsByCategory,
    categoryOptions,
    toolOptionsByCategory,
    allTools: validTools,
    totalTools: validTools.length
  };
}

/**
 * Formats a Polaris tool for Amazon Bedrock Converse toolConfig schema.
 * Sanitizes tool IDs from 'calendar.create_event' to 'calendar__create_event'.
 */
export function formatBedrockConverseTool(tool: Tool) {
  // Amazon Bedrock Converse tool name pattern: ^[a-zA-Z0-9_-]+$
  const sanitizedName = tool.id.replace(/\./g, '__');

  return {
    toolSpec: {
      name: sanitizedName,
      description: `${tool.name}: ${tool.description}`,
      inputSchema: {
        json: {
          type: 'object',
          properties: tool.parameters || {
            query: {
              type: 'string',
              description: 'Primary input argument for tool invocation'
            }
          },
          required: tool.parameters ? Object.keys(tool.parameters) : []
        }
      }
    }
  };
}

/**
 * Reverts sanitized Bedrock tool name back to canonical catalog tool ID.
 */
export function revertBedrockToolName(sanitizedName: string): string {
  return sanitizedName.replace(/__/g, '.');
}
