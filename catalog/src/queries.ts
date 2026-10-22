/**
 * Evaluation query generation.
 *
 * Every tool gets three labelled queries: one direct, one paraphrased and one
 * deliberately vague. On top of that there are about a hundred questions that
 * need no tool at all, and forty that were written by hand.
 *
 * The hand-written set matters. Templated queries are too clean, so the
 * accuracy numbers they produce flatter the router. The human set is the
 * control.
 */

import { gerund, splitName } from './naming.js';

export type QueryKind = 'direct' | 'paraphrase' | 'ambiguous' | 'no_tool' | 'human';
export type QuerySplit = 'dev' | 'test';

export interface EvalQuery {
  id: string;
  query: string;
  labelTool: string | null;
  kind: QueryKind;
  split: QuerySplit;
}

interface ToolLike {
  id: string;
  name: string;
  descriptor: string;
}

/* =========================================================================
   HELPERS
   ========================================================================= */

/** Frames that turn a verb phrase into a request. */
const FRAMES_DIRECT = ['can you', 'please', 'i need you to', 'could you'];
const FRAMES_PARAPHRASE = ['i need you to', 'can you', 'would you mind and', 'please'];

/** Verbs that need a preposition before their object. */
const PREPOSITIONS: Record<string, string> = {
  reply: 'to',
  pay: 'for',
  refer: 'to',
};

/** Words that end with `s` but are singular. */
const SINGULAR_S = new Set(['status', 'analysis', 'address', 'business', 'process', 'access']);

/**
 * Turn a third-person descriptor into an imperative phrase.
 *
 * English spells the third person two different ways: `changes` drops only
 * the `s`, but `watches` and `publishes` drop `es`. Getting this wrong
 * produces `chang` and `publish`, which is exactly the kind of noise that
 * makes an evaluation set untrustworthy.
 */
function thirdPersonToBase(word: string): string {
  const hyphen = word.lastIndexOf('-');
  if (hyphen > 0) {
    const prefix = word.slice(0, hyphen + 1);
    return prefix + thirdPersonToBase(word.slice(hyphen + 1));
  }
  const lower = word.toLowerCase();
  if (lower.endsWith('ies') && lower.length > 4) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith('es') && lower.length > 3) {
    const before = lower.slice(0, -2);
    const pair = before.slice(-2);
    if (['ch', 'sh', 'ss', 'x', 'z'].includes(pair) || before.endsWith('o')) return before;
    return lower.slice(0, -1);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
    return lower.slice(0, -1);
  }
  return word;
}

function imperative(descriptor: string): string {
  const words = descriptor.trim().split(/\s+/);
  if (words.length === 0) return descriptor;
  return [thirdPersonToBase(words[0]!), ...words.slice(1)].join(' ');
}

/**
 * The direct phrase: the action and the thing acted on, named plainly.
 *
 * Built from the tool name rather than the descriptor, because the name is
 * the label. A direct query must be traceable back to exactly one tool, or
 * the evaluation data is measuring the wrong thing.
 */
export function directPhrase(tool: ToolLike): string {
  const name = tool.id.includes('.') ? tool.id.slice(tool.id.indexOf('.') + 1) : tool.name;
  const { verb, object } = splitName(name);
  const action = verb ?? 'get';
  const target = trimObject(object, action);
  if (!target) return `${action} it`;

  const preposition = PREPOSITIONS[action];
  const plural = isPlural(target);
  const article = plural ? '' : 'the ';
  const phrase = preposition
    ? `${action} ${preposition} ${article}${target}`
    : `${action} ${article}${target}`;
  return phrase;
}

/** Drop a trailing word that repeats the verb, such as `payroll run`. */
function trimObject(object: string, action: string): string {
  const words = object.split(' ').filter(Boolean);
  if (words.length > 1 && words[words.length - 1] === action) {
    return words.slice(0, -1).join(' ');
  }
  return object;
}

function isPlural(word: string): boolean {
  const last = word.split(' ').at(-1) ?? word;
  if (!last.endsWith('s') || last.endsWith('ss')) return false;
  if (SINGULAR_S.has(last)) return false;
  return true;
}

/**
 * The vague half of the labelled set.
 *
 * The action is recognisable but every parameter is missing, so the router
 * has to pick a tool and then ask for the details. The wording is built from
 * the tool name so that no two labelled queries say the same thing: a
 * duplicated query with two different labels is not evaluation data.
 */
export function ambiguousPhrase(tool: ToolLike): string {
  const name = tool.id.includes('.') ? tool.id.slice(tool.id.indexOf('.') + 1) : tool.name;
  const { verb, object } = splitName(name);
  if (verb) return `can you help me with ${gerund(verb)} the ${object}?`;
  return `can you help me with the ${object}?`;
}

/** Deterministic identifier so the query file is byte-stable. */
function deterministicId(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i += 1) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 1), 2246822519) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return `${hex(h1).slice(0, 8)}-${hex(h2).slice(0, 4)}-4${hex(h1).slice(4, 7)}-a${hex(h2).slice(7, 10)}-${hex(h1)}${hex(h2)}`.slice(0, 36);
}

/* =========================================================================
   NO-TOOL QUESTIONS
   Questions a model can answer from its own knowledge. A router that sends a
   tool for these is wrong.
   ========================================================================= */

export const NO_TOOL_QUERIES: string[] = [
  'what is the capital of France',
  'explain photosynthesis in simple terms',
  'write a haiku about autumn rain',
  'what is 17 times 23',
  'who wrote the play Hamlet',
  'summarize the water cycle',
  'what is the difference between a virus and a bacterium',
  'give me three tips for better sleep',
  'how do I tie a Windsor knot',
  'why does the sky look red at sunset',
  'what is the tallest mountain on earth',
  'explain recursion to a beginner',
  'write a short thank-you note to a teacher',
  'name five famous Impressionist painters',
  'write a limerick about a lighthouse keeper',
  'what is the speed of light',
  'how do I remove a coffee stain from a shirt',
  'what causes inflation in an economy',
  'summarize the plot of Cinderella',
  'what is the difference between RAM and disk storage',
  'how long should bread dough rise',
  'what is the Pythagorean theorem',
  'who invented the printing press',
  'give me a simple recipe for lentil soup',
  'what is the difference between weather and climate',
  'explain what a neural network is',
  'list the planets in order from the sun',
  'what is the unit of electrical resistance',
  'how do vaccines work',
  'write a product description for a reusable water bottle',
  'what is the capital of Canada',
  'what is the smallest country in the world',
  'how do I write a good bug report',
  'what does the acronym API stand for',
  'why do leaves change colour',
  'how many continents are there',
  'what is a solar eclipse',
  'suggest a gift for a new colleague',
  'explain what a database index is',
  'what is the history of the Silk Road',
  'name four types of clouds',
  'what is the difference between a bug and a feature',
  'write a short bedtime story about a lost star',
  'how do I make cold brew coffee',
  'what is the chemical symbol for gold',
  'what is the largest desert on earth',
  'explain the offside rule in football',
  'what is the purpose of a sitemap',
  'how do I politely decline an invitation',
  'what is the Fermi paradox',
  'write a two line poem about a bicycle',
  'what causes the northern lights',
  'how do I improve my posture',
  'what is the difference between a mortgage and a loan',
  'name three famous museums',
  'what is machine translation',
  'how do I make a good cup of tea',
  'what is the longest river in the world',
  'explain what a hash function does',
  'what is the greenhouse effect',
  'write an email asking for a deadline extension',
  'what is the difference between an email and a letter',
  'how do I start composting at home',
  'what is the significance of the Rosetta Stone',
  'what is a black hole',
  'name two famous classical composers',
  'how do I train for a 10k run',
  'what is the history of the bicycle',
  'what does idempotent mean',
  'write a riddle about a candle',
  'how do I read a nutrition label',
  'what is the population of the world roughly',
  'explain what a credit score is',
  'what is the difference between weather forecasting and climate modelling',
  'name five countries in Europe',
  'what is a peninsula',
  'how do I plan a seven day trip',
  'write a short dialogue between two astronauts',
  'what is the difference between a simile and a metaphor',
  'what is the largest internal organ in the human body',
  'how do I sharpen a kitchen knife',
  'what is the etymology of the word salary',
  'explain what a compiler does',
  'what is the Beaufort scale',
  'name three Nobel Prize categories',
  'how do I negotiate a rent increase',
  'what is the difference between a lake and a pond',
  'what is a monad in programming',
  'write a subject line for a newsletter',
  'what causes hiccups',
  'explain what an API rate limit is',
  'what is the tallest tree species',
  'how do I care for a monstera plant',
  'what is the difference between a podcast and an audiobook',
  'what is the history of the marathon',
  'name two famous bridges',
  'what is the largest planet in the solar system',
  'how do I make a simple vinaigrette',
  'explain what a stack trace is',
  'what is the difference between a loan and an overdraft',
  'write a one line summary of the plot of Moby Dick',
  'how do I set up a budget spreadsheet',
  'what is the significance of the Rosetta Stone in modern linguistics',
];

/* =========================================================================
   HAND-WRITTEN QUERIES
   Written by hand, in the voice a person actually types. These are the
   control group against the templated queries.
   ========================================================================= */

export const HUMAN_QUERIES: ReadonlyArray<{ query: string; labelTool: string | null }> = [
  { query: 'put a dentist appointment in my calendar for tuesday at 4pm', labelTool: 'calendar.create_event' },
  { query: 'am i free on thursday afternoon for a coffee with priya', labelTool: 'calendar.find_free_slots' },
  { query: 'my laptop will not boot after the update, log a ticket for it', labelTool: 'tickets.open_issue' },
  { query: 'which support tickets are still open right now', labelTool: 'tickets.list_issues' },
  { query: 'email the whole team the quarterly numbers', labelTool: 'messaging.send_bulk_email' },
  { query: 'post in the general channel that the release is out', labelTool: 'messaging.send_chat_message' },
  { query: 'put the signed contract into the legal folder', labelTool: 'files.upload_file' },
  { query: 'send marcus a link to the deck', labelTool: 'files.share_file' },
  { query: 'add the new clinic as an account and put sarah on it', labelTool: 'crm.create_account' },
  { query: 'the northwind deal moved to negotiation, update it', labelTool: 'crm.update_deal_stage' },
  { query: 'invoice the hollis group for the second batch of work', labelTool: 'billing.create_invoice' },
  { query: 'our subscription plan needs more seats, change it', labelTool: 'billing.update_subscription' },
  { query: 'the singapore warehouse is low on packing tape', labelTool: 'inventory.low_stock_report' },
  { query: 'raise a purchase order for 200 more of the blue sensor', labelTool: 'inventory.create_purchase_order' },
  { query: 'record the hours i worked on the migration this week', labelTool: 'hr.timesheet_report' },
  { query: 'i need two days off in march, put in the request', labelTool: 'hr.request_leave' },
  { query: 'how many active users did we have last week', labelTool: 'analytics.metric_value' },
  { query: 'build me a weekly signups dashboard', labelTool: 'analytics.create_dashboard' },
  { query: 'grant priya the admin role', labelTool: 'identity.assign_role' },
  { query: 'reset the password for the new intern', labelTool: 'identity.reset_password' },
  { query: 'write the onboarding page for the engineering wiki', labelTool: 'knowledge.create_page' },
  { query: 'publish the runbook we finished last week', labelTool: 'knowledge.publish_page' },
  { query: 'make a workflow that fires when a ticket is created', labelTool: 'workflows.create_trigger' },
  { query: 'run the nightly reconciliation workflow now', labelTool: 'workflows.run_workflow' },
  { query: 'approve the pending purchase request from the design team', labelTool: 'workflows.approve_request' },
  { query: 'what did i leave in the shared drive last month', labelTool: 'files.search_files' },
  { query: 'put my notes from the call with the client somewhere i can find them', labelTool: 'knowledge.create_page' },
  { query: 'close out the ticket about the broken export', labelTool: 'tickets.close_issue' },
  { query: 'add a new contact for the dentist office', labelTool: 'crm.create_contact' },
  { query: 'track my parcel that shipped yesterday', labelTool: 'inventory.track_shipment' },
  { query: 'who is the manager of the person i sit next to', labelTool: 'hr.org_chart' },
  { query: 'how many tickets are close to breaching sla', labelTool: 'tickets.sla_report' },
  { query: 'cancel the meeting scheduled for friday', labelTool: 'calendar.cancel_event' },
  { query: 'reply to the invoice email saying it is paid', labelTool: 'messaging.reply_message' },
  { query: 'generate a payslip for october', labelTool: 'hr.generate_payslip' },
  { query: 'add a stage to the onboarding workflow', labelTool: 'workflows.create_action' },
  { query: 'find the pages about our deployment process', labelTool: 'knowledge.search_pages' },
  { query: 'show me where people drop off in the signup flow', labelTool: 'analytics.funnel_report' },
  { query: 'schedule the monthly report to go out every first monday', labelTool: 'analytics.schedule_report' },
  { query: 'who is assigned to the most urgent open tickets', labelTool: 'tickets.list_issues' },
];

/* =========================================================================
   GENERATION
   ========================================================================= */

export function generateQueries(tools: ToolLike[]): EvalQuery[] {
  const queries: EvalQuery[] = [];

  tools.forEach((tool, index) => {
    const full = imperative(tool.descriptor);
    const directFrame = FRAMES_DIRECT[index % FRAMES_DIRECT.length]!;
    const paraphraseFrame = FRAMES_PARAPHRASE[index % FRAMES_PARAPHRASE.length]!;

    queries.push({
      id: deterministicId(`${tool.id}|direct`),
      query: `${directFrame} ${directPhrase(tool)}`,
      labelTool: tool.id,
      kind: 'direct',
      split: 'dev',
    });

    queries.push({
      id: deterministicId(`${tool.id}|paraphrase`),
      query: `${paraphraseFrame} ${full}`,
      labelTool: tool.id,
      kind: 'paraphrase',
      split: 'dev',
    });

    queries.push({
      id: deterministicId(`${tool.id}|ambiguous`),
      query: ambiguousPhrase(tool),
      labelTool: tool.id,
      kind: 'ambiguous',
      split: 'dev',
    });
  });

  for (const text of NO_TOOL_QUERIES) {
    queries.push({
      id: deterministicId(`no_tool|${text}`),
      query: text,
      labelTool: null,
      kind: 'no_tool',
      split: 'dev',
    });
  }

  for (const { query, labelTool } of HUMAN_QUERIES) {
    queries.push({
      id: deterministicId(`human|${query}`),
      query,
      labelTool,
      kind: 'human',
      split: 'dev',
    });
  }

  return assignSplits(queries);
}

/**
 * Split every kind evenly between dev and test. Thresholds are tuned on dev
 * only, so the two halves must not differ in difficulty.
 *
 * The split is exactly half overall and as close to half as each kind allows.
 */
export function assignSplits(queries: EvalQuery[]): EvalQuery[] {
  const kinds = [...new Set(queries.map((query) => query.kind))].sort();
  const byKind = new Map<QueryKind, EvalQuery[]>();
  for (const kind of kinds) {
    byKind.set(
      kind,
      queries.filter((query) => query.kind === kind).sort((a, b) => (a.id < b.id ? -1 : 1)),
    );
  }

  const total = queries.length;
  const targetDev = Math.floor(total / 2);

  // Largest remainder: hand each kind its proportional share of the dev
  // half, then give the rounding remainder to the kinds with the biggest
  // fractional part.
  const exact = kinds.map((kind) => {
    const size = byKind.get(kind)!.length;
    const share = (size * targetDev) / total;
    return { kind, floor: Math.floor(share), fraction: share - Math.floor(share) };
  });
  let assigned = exact.reduce((sum, entry) => sum + entry.floor, 0);
  const byFraction = [...exact].sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction;
    return a.kind < b.kind ? -1 : 1;
  });
  for (const entry of byFraction) {
    if (assigned >= targetDev) break;
    const size = byKind.get(entry.kind)!.length;
    if (entry.floor < size) {
      entry.floor += 1;
      assigned += 1;
    }
  }

  const split: EvalQuery[] = [];
  for (const entry of exact) {
    const bucket = byKind.get(entry.kind)!;
    bucket.forEach((query, index) => {
      split.push({ ...query, split: index < entry.floor ? 'dev' : 'test' });
    });
  }

  split.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return split;
}
