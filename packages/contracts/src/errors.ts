import { z } from 'zod';

/* =========================================================================
   ERROR ENVELOPE
   Single shape for every failure the API can return. The web app maps the
   code to an error-screen variant; it never parses free-form text.
   ========================================================================= */

export const ERROR_CODES = [
  'BAD_REQUEST',
  'NOT_FOUND',
  'RATE_LIMITED',
  'BUDGET_EXHAUSTED',
  'DECIDER_UNAVAILABLE',
  'BEDROCK_THROTTLED',
  'INTERNAL',
] as const;

export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorDetailSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  requestId: z.string().min(1),
  /** Seconds to wait before retrying. Present on RATE_LIMITED and BEDROCK_THROTTLED. */
  retryAfter: z.number().int().nonnegative().optional(),
  /** Field-level detail for BAD_REQUEST. */
  details: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

export const ErrorEnvelopeSchema = z.object({
  error: ErrorDetailSchema,
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/** Map an error code to the HTTP status it should be served with. */
export const ERROR_STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  BUDGET_EXHAUSTED: 429,
  DECIDER_UNAVAILABLE: 503,
  BEDROCK_THROTTLED: 503,
  INTERNAL: 500,
};
