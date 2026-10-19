/**
 * POLARIS Safety Middleware Suite
 *
 * Implements:
 * 1. Request ID tracking (x-request-id header)
 * 2. Sliding window rate-limiting (60 req/min)
 * 3. Enterprise spend kill-switch ($25.00 budget limit)
 * 4. Standardized JSON error response envelope
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/* =========================================================================
   1. REQUEST ID MIDDLEWARE
   ========================================================================= */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.length > 0 
    ? incomingId 
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

/* =========================================================================
   2. SPEND KILL-SWITCH
   ========================================================================= */
class SpendBudgetManager {
  private cumulativeSpendUsd: number = 0;
  private maxBudgetUsd: number = parseFloat(process.env.MAX_BUDGET_USD || '25.00');

  public recordSpend(amountUsd: number): void {
    if (amountUsd > 0) {
      this.cumulativeSpendUsd = Number((this.cumulativeSpendUsd + amountUsd).toFixed(6));
    }
  }

  public getStatus() {
    return {
      cumulativeSpendUsd: this.cumulativeSpendUsd,
      maxBudgetUsd: this.maxBudgetUsd,
      remainingUsd: Math.max(0, Number((this.maxBudgetUsd - this.cumulativeSpendUsd).toFixed(4))),
      isExhausted: this.cumulativeSpendUsd >= this.maxBudgetUsd,
    };
  }

  public reset(): void {
    this.cumulativeSpendUsd = 0;
  }
}

export const spendBudget = new SpendBudgetManager();

export function spendKillSwitchMiddleware(req: Request, res: Response, next: NextFunction): void {
  const status = spendBudget.getStatus();
  if (status.isExhausted) {
    res.status(429).json({
      error: {
        code: 'BUDGET_EXHAUSTED',
        message: `Demo spend kill-switch active: Cumulative Bedrock spend reached $${status.cumulativeSpendUsd.toFixed(2)} (limit $${status.maxBudgetUsd.toFixed(2)}).`,
        requestId: req.id,
      },
    });
    return;
  }
  next();
}

/* =========================================================================
   3. IN-MEMORY RATE LIMITER (60 req/min)
   ========================================================================= */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute.`,
        retryAfterSeconds: retryAfterSec,
        requestId: req.id,
      },
    });
    return;
  }

  next();
}

/* =========================================================================
   4. CENTRALIZED ERROR ENVELOPE
   ========================================================================= */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected server error occurred.';

  res.status(statusCode).json({
    error: {
      code,
      message,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  });
}
