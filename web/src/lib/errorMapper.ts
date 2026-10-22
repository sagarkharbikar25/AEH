/**
 * POLARIS Error Mapper
 *
 * Maps @polaris/contracts error envelopes and HTTP status codes to one of the 9 UI
 * error variants.
 */

import { type ErrorEnvelope, type ErrorCode } from '@polaris/contracts';
import { type ErrorVariant } from '../types.js';

export function mapErrorToVariant(
  error: ErrorEnvelope | ErrorCode | { code?: string } | Error | null | undefined
): ErrorVariant {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'no_network';
  }

  if (!error) return 'server_error';

  const code = String((error as ErrorEnvelope)?.error?.code || (error as any)?.code || (error as any)?.name || '');

  switch (code) {
    case 'BAD_REQUEST':
      return 'inline_validation';
    case 'NOT_FOUND':
      return 'not_found';
    case 'RATE_LIMITED':
      return 'rate_limited';
    case 'BUDGET_EXHAUSTED':
      return 'budget_exhausted';
    case 'DECIDER_UNAVAILABLE':
      return 'offline_backend';
    case 'BEDROCK_THROTTLED':
      return 'throttled';
    case 'SIGNAL_LOST':
      return 'signal_lost';
    case 'INTERNAL':
    default:
      return 'server_error';
  }
}
