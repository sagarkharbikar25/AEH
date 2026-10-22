/**
 * Shared naming helpers.
 *
 * Tool names are `verb_object` in snake_case, but not every name starts with a
 * verb (`org_chart`, `sla_report`). These helpers split a name into its verb
 * and object when they can, so the query generator can write a vague request
 * that still points at one specific tool.
 */

export const VERB_TOKENS = new Set([
  'activate', 'add', 'adjust', 'apply', 'approve', 'assign', 'attach', 'book', 'build', 'cancel',
  'change', 'check', 'close', 'compress', 'convert', 'copy', 'count', 'create', 'cycle',
  'deactivate', 'decline', 'delete', 'disable', 'download', 'draft', 'duplicate', 'enable',
  'escalate', 'estimate', 'export', 'extract', 'find', 'forward', 'force', 'forecast', 'generate',
  'get', 'grant', 'import', 'invite', 'link', 'list', 'lock', 'log', 'merge', 'mark', 'move',
  'mute', 'open', 'pin', 'preview', 'print', 'publish', 'qualify', 'read', 'receive', 'record',
  'refresh', 'register', 'reject', 'release', 'remove', 'rename', 'reopen', 'reply', 'report',
  'request', 'reschedule', 'reset', 'restore', 'review', 'revoke', 'retry', 'refund', 'run', 'scan',
  'schedule', 'search', 'segment', 'send', 'set', 'share', 'submit', 'suggest', 'tag', 'terminate',
  'track', 'transfer', 'unpublish', 'update', 'upload', 'verify', 'view', 'void',
]);

const CONNECTOR_TOKENS = new Set(['from', 'to', 'for', 'by', 'per', 'with', 'into', 'on', 'at']);

export interface SplitName {
  verb: string | null;
  object: string;
}

export function splitName(name: string): SplitName {
  const tokens = name.split('_').filter(Boolean);
  if (tokens.length === 0) return { verb: null, object: '' };
  const first = tokens[0]!;
  if (tokens.length > 1 && VERB_TOKENS.has(first)) {
    return { verb: first, object: tokens.slice(1).join(' ') };
  }
  return { verb: null, object: tokens.join(' ') };
}

/** The object words of a tool name, with filler words removed. */
export function objectWords(name: string): string {
  const tokens = name.split('_').filter(Boolean);
  const rest = tokens.length > 0 && VERB_TOKENS.has(tokens[0]!) ? tokens.slice(1) : tokens;
  const cleaned = rest.filter((t) => !CONNECTOR_TOKENS.has(t));
  const words = cleaned.length > 0 ? cleaned : rest;
  return words.join(' ');
}

/**
 * Gerunds are spelled out rather than derived. English doubling rules are
 * full of exceptions (`cancel` -> `cancelling` but `visit` -> `visiting`) and
 * a wrong gerund in an evaluation set is a wrong evaluation set.
 */
const GERUNDS: Record<string, string> = {
  activate: 'activating',
  add: 'adding',
  adjust: 'adjusting',
  apply: 'applying',
  approve: 'approving',
  assign: 'assigning',
  attach: 'attaching',
  book: 'booking',
  build: 'building',
  cancel: 'cancelling',
  change: 'changing',
  check: 'checking',
  close: 'closing',
  compress: 'compressing',
  convert: 'converting',
  copy: 'copying',
  count: 'counting',
  create: 'creating',
  cycle: 'cycling',
  deactivate: 'deactivating',
  decline: 'declining',
  delete: 'deleting',
  disable: 'disabling',
  download: 'downloading',
  draft: 'drafting',
  duplicate: 'duplicating',
  enable: 'enabling',
  escalate: 'escalating',
  estimate: 'estimating',
  export: 'exporting',
  extract: 'extracting',
  find: 'finding',
  force: 'forcing',
  forward: 'forwarding',
  forecast: 'forecasting',
  generate: 'generating',
  get: 'getting',
  grant: 'granting',
  import: 'importing',
  invite: 'inviting',
  link: 'linking',
  list: 'listing',
  lock: 'locking',
  log: 'logging',
  mark: 'marking',
  merge: 'merging',
  move: 'moving',
  mute: 'muting',
  open: 'opening',
  pin: 'pinning',
  preview: 'previewing',
  print: 'printing',
  publish: 'publishing',
  qualify: 'qualifying',
  read: 'reading',
  receive: 'receiving',
  record: 'recording',
  refresh: 'refreshing',
  register: 'registering',
  reject: 'rejecting',
  release: 'releasing',
  remove: 'removing',
  rename: 'renaming',
  reopen: 'reopening',
  reply: 'replying',
  report: 'reporting',
  request: 'requesting',
  reschedule: 'rescheduling',
  reset: 'resetting',
  restore: 'restoring',
  review: 'reviewing',
  revoke: 'revoking',
  run: 'running',
  scan: 'scanning',
  schedule: 'scheduling',
  search: 'searching',
  segment: 'segmenting',
  send: 'sending',
  set: 'setting',
  share: 'sharing',
  submit: 'submitting',
  suggest: 'suggesting',
  tag: 'tagging',
  terminate: 'terminating',
  track: 'tracking',
  transfer: 'transferring',
  unpublish: 'unpublishing',
  update: 'updating',
  upload: 'uploading',
  verify: 'verifying',
  view: 'viewing',
  void: 'voiding',
};

export function gerund(verb: string): string {
  const known = GERUNDS[verb];
  if (known) return known;
  if (verb.endsWith('ing')) return verb;
  if (verb.endsWith('e')) return `${verb.slice(0, -1)}ing`;
  return `${verb}ing`;
}
