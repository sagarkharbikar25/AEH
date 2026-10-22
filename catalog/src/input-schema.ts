import type { CategorySeed, ToolOp } from './catalog.config.js';

export interface ParamSpec {
  name: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

type ParamTuple = readonly [name: string, type: ParamSpec['type'], required: boolean, description: string];

/**
 * Per-category fields. The tool name says what the action is; this says what
 * the action needs. Every tool in a category shares the same shape, which is
 * what a real internal API of that kind tends to look like.
 */
const CATEGORY_FIELDS: Record<string, Record<string, ParamTuple[]>> = {
  calendar: {
    create: [
      ['title', 'string', true, 'Short title of the event'],
      ['startsAt', 'string', true, 'ISO start timestamp'],
      ['durationMinutes', 'integer', false, 'Length of the event in minutes'],
      ['attendeeIds', 'array', false, 'Identifiers of the invited attendees'],
    ],
    read: [['eventId', 'string', true, 'Identifier of the event']],
    update: [
      ['eventId', 'string', true, 'Identifier of the event'],
      ['changes', 'object', true, 'Fields to change on the event'],
    ],
    delete: [['eventId', 'string', true, 'Identifier of the event']],
    list: [
      ['from', 'string', false, 'ISO start of the range to list'],
      ['to', 'string', false, 'ISO end of the range to list'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against titles'],
      ['from', 'string', false, 'ISO start of the range to search'],
    ],
    execute: [
      ['eventId', 'string', true, 'Identifier of the event'],
      ['attendeeIds', 'array', false, 'Identifiers of the attendees'],
    ],
  },
  tickets: {
    create: [
      ['title', 'string', true, 'Short title of the issue'],
      ['body', 'string', true, 'Description of the problem'],
      ['priority', 'string', false, 'Initial priority of the issue'],
    ],
    read: [['issueId', 'string', true, 'Identifier of the issue']],
    update: [
      ['issueId', 'string', true, 'Identifier of the issue'],
      ['changes', 'object', true, 'Fields to change on the issue'],
    ],
    delete: [['issueId', 'string', true, 'Identifier of the issue']],
    list: [
      ['status', 'string', false, 'Status to filter by'],
      ['assigneeId', 'string', false, 'Assignee to filter by'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against issues'],
      ['status', 'string', false, 'Status to filter by'],
    ],
    execute: [
      ['issueId', 'string', true, 'Identifier of the issue'],
      ['comment', 'string', false, 'Comment or note to record'],
    ],
  },
  messaging: {
    create: [
      ['to', 'array', true, 'Recipient identifiers'],
      ['subject', 'string', false, 'Subject line'],
      ['body', 'string', true, 'Message body'],
    ],
    read: [['messageId', 'string', true, 'Identifier of the message']],
    update: [
      ['messageId', 'string', true, 'Identifier of the message'],
      ['changes', 'object', true, 'Fields to change on the message'],
    ],
    delete: [['messageId', 'string', true, 'Identifier of the message']],
    list: [
      ['folder', 'string', false, 'Folder to list'],
      ['unreadOnly', 'boolean', false, 'Return only unread messages'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against messages'],
      ['channelId', 'string', false, 'Channel to search in'],
    ],
    execute: [
      ['messageId', 'string', true, 'Identifier of the message'],
      ['body', 'string', false, 'Body used for the action'],
    ],
  },
  files: {
    create: [
      ['name', 'string', true, 'File name'],
      ['folderId', 'string', false, 'Destination folder'],
    ],
    read: [['fileId', 'string', true, 'Identifier of the file']],
    update: [
      ['fileId', 'string', true, 'Identifier of the file'],
      ['changes', 'object', true, 'Fields to change on the file'],
    ],
    delete: [['fileId', 'string', true, 'Identifier of the file']],
    list: [
      ['folderId', 'string', false, 'Folder to list'],
      ['limit', 'integer', false, 'Maximum number of entries'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against file names'],
      ['folderId', 'string', false, 'Folder to search in'],
    ],
    execute: [
      ['fileId', 'string', true, 'Identifier of the file'],
      ['shareWith', 'string', false, 'Identifier to share with'],
    ],
  },
  crm: {
    create: [
      ['name', 'string', true, 'Name of the person or organisation'],
      ['company', 'string', false, 'Organisation the person belongs to'],
      ['email', 'string', false, 'Email address of the person'],
    ],
    read: [['recordId', 'string', true, 'Identifier of the record']],
    update: [
      ['recordId', 'string', true, 'Identifier of the record'],
      ['changes', 'object', true, 'Fields to change on the record'],
    ],
    delete: [['recordId', 'string', true, 'Identifier of the record']],
    list: [
      ['ownerId', 'string', false, 'Owner to filter by'],
      ['tier', 'string', false, 'Account tier to filter by'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against records'],
      ['company', 'string', false, 'Organisation to filter by'],
    ],
    execute: [
      ['recordId', 'string', true, 'Identifier of the record'],
      ['note', 'string', false, 'Note to attach'],
    ],
  },
  billing: {
    create: [
      ['customerId', 'string', true, 'Customer the invoice belongs to'],
      ['amount', 'number', true, 'Total amount in the currency'],
      ['currency', 'string', false, 'ISO currency code'],
    ],
    read: [['invoiceId', 'string', true, 'Identifier of the invoice']],
    update: [
      ['invoiceId', 'string', true, 'Identifier of the invoice'],
      ['changes', 'object', true, 'Fields to change on the invoice'],
    ],
    delete: [['invoiceId', 'string', true, 'Identifier of the invoice']],
    list: [
      ['status', 'string', false, 'Status to filter by'],
      ['customerId', 'string', false, 'Customer to filter by'],
    ],
    search: [
      ['invoiceNumber', 'string', false, 'Invoice number to match'],
      ['customerName', 'string', false, 'Customer name to match'],
    ],
    execute: [
      ['invoiceId', 'string', true, 'Identifier of the invoice'],
      ['amount', 'number', false, 'Amount used for the action'],
    ],
  },
  inventory: {
    create: [
      ['sku', 'string', true, 'Stock keeping unit'],
      ['name', 'string', true, 'Name of the item'],
      ['quantity', 'integer', false, 'Initial quantity in stock'],
    ],
    read: [['itemId', 'string', true, 'Identifier of the item']],
    update: [
      ['itemId', 'string', true, 'Identifier of the item'],
      ['changes', 'object', true, 'Fields to change on the item'],
    ],
    delete: [['itemId', 'string', true, 'Identifier of the item']],
    list: [
      ['warehouseId', 'string', false, 'Warehouse to list'],
      ['sku', 'string', false, 'Stock keeping unit to filter by'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against item names'],
      ['sku', 'string', false, 'Stock keeping unit to filter by'],
    ],
    execute: [
      ['itemId', 'string', true, 'Identifier of the item'],
      ['quantity', 'integer', false, 'Quantity used for the action'],
    ],
  },
  hr: {
    create: [
      ['name', 'string', true, 'Full name of the employee'],
      ['email', 'string', true, 'Work email address'],
      ['department', 'string', false, 'Department the employee joins'],
    ],
    read: [['employeeId', 'string', true, 'Identifier of the employee']],
    update: [
      ['employeeId', 'string', true, 'Identifier of the employee'],
      ['changes', 'object', true, 'Fields to change on the profile'],
    ],
    delete: [['employeeId', 'string', true, 'Identifier of the employee']],
    list: [
      ['department', 'string', false, 'Department to filter by'],
      ['status', 'string', false, 'Employment status to filter by'],
    ],
    search: [
      ['name', 'string', false, 'Name to match'],
      ['role', 'string', false, 'Role to match'],
    ],
    execute: [
      ['employeeId', 'string', true, 'Identifier of the employee'],
      ['note', 'string', false, 'Note to attach'],
    ],
  },
  analytics: {
    create: [
      ['name', 'string', true, 'Name of the report or dashboard'],
      ['dataset', 'string', true, 'Dataset the artefact reads from'],
    ],
    read: [['artefactId', 'string', true, 'Identifier of the artefact']],
    update: [
      ['artefactId', 'string', true, 'Identifier of the artefact'],
      ['changes', 'object', true, 'Fields to change on the artefact'],
    ],
    delete: [['artefactId', 'string', true, 'Identifier of the artefact']],
    list: [
      ['dataset', 'string', false, 'Dataset to filter by'],
      ['range', 'string', false, 'Reporting range such as last_30_days'],
    ],
    search: [
      ['metric', 'string', false, 'Metric name to match'],
      ['range', 'string', false, 'Reporting range to filter by'],
    ],
    execute: [
      ['artefactId', 'string', true, 'Identifier of the artefact'],
      ['range', 'string', false, 'Reporting range to run for'],
    ],
  },
  identity: {
    create: [
      ['email', 'string', true, 'Email address of the account'],
      ['name', 'string', true, 'Display name of the account'],
      ['roleIds', 'array', false, 'Roles to grant on creation'],
    ],
    read: [['userId', 'string', true, 'Identifier of the account']],
    update: [
      ['userId', 'string', true, 'Identifier of the account'],
      ['changes', 'object', true, 'Fields to change on the account'],
    ],
    delete: [['userId', 'string', true, 'Identifier of the account']],
    list: [
      ['role', 'string', false, 'Role to filter by'],
      ['status', 'string', false, 'Account status to filter by'],
    ],
    search: [
      ['email', 'string', false, 'Email to match'],
      ['name', 'string', false, 'Display name to match'],
    ],
    execute: [
      ['userId', 'string', true, 'Identifier of the account'],
      ['roleId', 'string', false, 'Role used for the action'],
    ],
  },
  knowledge: {
    create: [
      ['title', 'string', true, 'Title of the page'],
      ['spaceId', 'string', true, 'Space the page belongs to'],
      ['body', 'string', true, 'Markdown body of the page'],
    ],
    read: [['pageId', 'string', true, 'Identifier of the page']],
    update: [
      ['pageId', 'string', true, 'Identifier of the page'],
      ['changes', 'object', true, 'Fields to change on the page'],
    ],
    delete: [['pageId', 'string', true, 'Identifier of the page']],
    list: [
      ['spaceId', 'string', false, 'Space to list'],
      ['updatedAfter', 'string', false, 'ISO timestamp to filter by'],
    ],
    search: [
      ['text', 'string', true, 'Text to match against page bodies'],
      ['spaceId', 'string', false, 'Space to search in'],
    ],
    execute: [
      ['pageId', 'string', true, 'Identifier of the page'],
      ['body', 'string', false, 'Body used for the action'],
    ],
  },
  workflows: {
    create: [
      ['name', 'string', true, 'Name of the workflow'],
      ['steps', 'array', true, 'Ordered list of action steps'],
    ],
    read: [['workflowId', 'string', true, 'Identifier of the workflow']],
    update: [
      ['workflowId', 'string', true, 'Identifier of the workflow'],
      ['changes', 'object', true, 'Fields to change on the workflow'],
    ],
    delete: [['workflowId', 'string', true, 'Identifier of the workflow']],
    list: [['active', 'boolean', false, 'Return only active workflows']],
    search: [['name', 'string', true, 'Name to match against workflows']],
    execute: [
      ['workflowId', 'string', true, 'Identifier of the workflow'],
      ['inputs', 'object', false, 'Inputs for the run'],
    ],
  },
};

/** Fallback fields for a category that was not given an explicit set. */
const DEFAULT_FIELDS = {
  create: [
    ['name', 'string', true, 'Name of the record'],
    ['attributes', 'object', false, 'Additional attributes'],
  ],
  read: [['id', 'string', true, 'Identifier of the record']],
  update: [
    ['id', 'string', true, 'Identifier of the record'],
    ['changes', 'object', true, 'Fields to change on the record'],
  ],
  delete: [['id', 'string', true, 'Identifier of the record']],
  list: [['limit', 'integer', false, 'Maximum number of entries']],
  search: [['text', 'string', true, 'Text to match against records']],
  execute: [
    ['id', 'string', true, 'Identifier of the record'],
    ['arguments', 'object', false, 'Arguments for the action'],
  ],
} satisfies Record<ToolOp, ParamTuple[]>;

export function fieldsFor(category: CategorySeed, op: ToolOp): ParamSpec[] {
  const byOp = CATEGORY_FIELDS[category.id]?.[op] ?? DEFAULT_FIELDS[op];
  return byOp.map(([name, type, required, description]) => ({
    name,
    type,
    required,
    description,
  }));
}

/** Build the JSON Schema for one tool. */
export function buildInputSchema(category: CategorySeed, op: ToolOp): Record<string, unknown> {
  const fields = fieldsFor(category, op);
  const properties: Record<string, unknown> = {};
  for (const field of fields) {
    properties[field.name] = {
      type: field.type,
      description: field.description,
    };
  }
  return {
    type: 'object',
    properties,
    required: fields.filter((f) => f.required).map((f) => f.name),
    additionalProperties: false,
  };
}
