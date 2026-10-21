/**
 * @polaris/contracts
 *
 * The single source of truth for every shape that crosses a boundary in
 * POLARIS: the SSE race events, the API error envelope, the catalog and the
 * shortlist. The server validates what it sends and what it receives against
 * these schemas; the web app imports the same types. Neither side may define
 * its own copy.
 */

export * from './errors.js';
export * from './catalog.js';
export * from './events.js';
export * from './api.js';
