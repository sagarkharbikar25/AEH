/**
 * POLARIS Safety Middleware Suite
 *
 * Implements:
 * 1. Request ID tracking (x-request-id header)
 * 2. Request timeouts with clean 500 INTERNAL abort response
 * 3. Daily UTC spend kill-switch ($25.00 budget limit)
 * 4. Sliding window rate-limiting (60 req/min) returning RATE_LIMITED with retryAfter
 * 5. Centralized error handling returning the contract error envelope
 */

import { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import { ZodError } from 'zod';
import { sendApiError, ApiError } from '../lib/errors.js';

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
   2. REQUEST TIMEOUT MIDDLEWARE
   ========================================================================= */
export function requestTimeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        sendApiError(
          res,
          req,
          'INTERNAL',
          `Request deadline exceeded: operation timed out after ${timeoutMs}ms.`,
          { status: 500 }
        );
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

/* =========================================================================
   3. DAILY UTC SPEND KILL-SWITCH
   ========================================================================= */
class DailySpendBudgetManager {
  private dailySpendUsd: Map<string, number> = new Map();
  private maxDailyBudgetUsd: number = parseFloat(
    process.env.DAILY_BUDGET_USD || process.env.MAX_BUDGET_USD || '25.00'
  );

  private getUtcDay(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public recordSpend(amountUsd: number): void {
    if (amountUsd > 0) {
      const day = this.getUtcDay();
      const current = this.dailySpendUsd.get(day) || 0;
      const updated = Number((current + amountUsd).toFixed(6));
      this.dailySpendUsd.set(day, updated);
    }
  }

  public getStatus() {
    const day = this.getUtcDay();
    const current = this.dailySpendUsd.get(day) || 0;
    return {
      utcDay: day,
      cumulativeSpendUsd: current,
      maxBudgetUsd: this.maxDailyBudgetUsd,
      remainingUsd: Math.max(0, Number((this.maxDailyBudgetUsd - current).toFixed(4))),
      isExhausted: current >= this.maxDailyBudgetUsd,
    };
  }

  public reset(): void {
    this.dailySpendUsd.clear();
  }
}

export const spendBudget = new DailySpendBudgetManager();

export function spendKillSwitchMiddleware(req: Request, res: Response, next: NextFunction): void {
  const status = spendBudget.getStatus();
  if (status.isExhausted) {
    sendApiError(
      res,
      req,
      'BUDGET_EXHAUSTED',
      `Demo spend kill-switch active: Today's UTC Bedrock spend reached $${status.cumulativeSpendUsd.toFixed(2)} (daily limit $${status.maxBudgetUsd.toFixed(2)}).`,
      { status: 429 }
    );
    return;
  }
  next();
}

/* =========================================================================
   4. IN-MEMORY RATE LIMITER (60 req/min)
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
    sendApiError(
      res,
      req,
      'RATE_LIMITED',
      `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute.`,
      {
        status: 429,
        retryAfter: retryAfterSec,
      }
    );
    return;
  }

  next();
}

/* =========================================================================
   5. CENTRALIZED ERROR HANDLER
   ========================================================================= */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    sendApiError(res, req, err.code, err.message, {
      status: err.status,
      retryAfter: err.retryAfter,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    const issues = err.issues || [];
    const details = issues.map((issue: any) => ({
      path: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
      message: issue.message || 'Invalid value',
    }));
    sendApiError(res, req, 'BAD_REQUEST', 'Request validation failed', {
      status: 400,
      details,
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal error occurred.';

  sendApiError(res, req, 'INTERNAL', message, { status: statusCode });
}
