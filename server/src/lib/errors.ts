import { type Response, type Request } from 'express';
import {
  type ErrorCode,
  ERROR_STATUS_BY_CODE,
  type ErrorEnvelope,
  ErrorEnvelopeSchema,
} from '@polaris/contracts';

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly retryAfter?: number;
  public readonly details?: Array<{ path: string; message: string }>;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      status?: number;
      retryAfter?: number;
      details?: Array<{ path: string; message: string }>;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status ?? ERROR_STATUS_BY_CODE[code] ?? 500;
    this.retryAfter = options?.retryAfter;
    this.details = options?.details;
  }
}

export function sendApiError(
  res: Response,
  req: Request,
  code: ErrorCode,
  message: string,
  options?: {
    status?: number;
    retryAfter?: number;
    details?: Array<{ path: string; message: string }>;
  }
): void {
  const status = options?.status ?? ERROR_STATUS_BY_CODE[code] ?? 500;
  const requestId = (req.id as string) || (res.getHeader('x-request-id') as string) || 'req_unknown';

  const envelope: ErrorEnvelope = {
    error: {
      code,
      message,
      requestId,
      ...(typeof options?.retryAfter === 'number' ? { retryAfter: options.retryAfter } : {}),
      ...(options?.details && options.details.length > 0 ? { details: options.details } : {}),
    },
  };

  // Validate envelope in development/testing against the zod contract
  ErrorEnvelopeSchema.parse(envelope);

  if (typeof options?.retryAfter === 'number') {
    res.setHeader('Retry-After', options.retryAfter);
  }

  res.status(status).json(envelope);
}
