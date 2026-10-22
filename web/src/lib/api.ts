/**
 * POLARIS Frontend API Client
 *
 * Provides strongly-typed client bindings for the Express backend:
 * - GET  /api/health
 * - GET  /api/catalog
 * - POST /api/route
 * - POST /api/race
 * - GET  /api/bench/latest
 * - GET  /api/runs/:id
 */

import {
  type Health,
  HealthSchema,
  type CatalogResponse,
  CatalogResponseSchema,
  type RouteResponse,
  RouteResponseSchema,
  type RaceAccepted,
  RaceAcceptedSchema,
  type BenchResults,
  BenchResultsSchema,
  type Run,
  RunSchema,
  type ErrorEnvelope,
  ErrorEnvelopeSchema,
} from '@polaris/contracts';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export class PolarisApiClientError extends Error {
  public envelope?: ErrorEnvelope;
  public status: number;

  constructor(message: string, status: number, envelope?: ErrorEnvelope) {
    super(message);
    this.name = 'PolarisApiClientError';
    this.status = status;
    this.envelope = envelope;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (netErr: any) {
    throw new PolarisApiClientError(
      `Network connection failed: ${netErr.message}`,
      0,
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to connect to Polaris API server. Verify server is running on :3000.',
          requestId: 'net_fail',
        },
      }
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    let parsedEnvelope: ErrorEnvelope | undefined;
    if (json) {
      const parsed = ErrorEnvelopeSchema.safeParse(json);
      if (parsed.success) {
        parsedEnvelope = parsed.data;
      }
    }
    const message = parsedEnvelope?.error.message || `API error HTTP ${res.status}`;
    throw new PolarisApiClientError(message, res.status, parsedEnvelope);
  }

  return json as T;
}

export const api = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async getHealth(): Promise<Health> {
    const data = await request<Health>('/api/health');
    return HealthSchema.parse(data);
  },

  async getCatalog(): Promise<CatalogResponse> {
    const data = await request<CatalogResponse>('/api/catalog');
    return CatalogResponseSchema.parse(data);
  },

  async postRoute(query: string): Promise<RouteResponse> {
    const data = await request<RouteResponse>('/api/route', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return RouteResponseSchema.parse(data);
  },

  async postRace(query: string): Promise<RaceAccepted> {
    const data = await request<RaceAccepted>('/api/race', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return RaceAcceptedSchema.parse(data);
  },

  async getBenchLatest(): Promise<BenchResults> {
    const data = await request<BenchResults>('/api/bench/latest');
    return BenchResultsSchema.parse(data);
  },

  async getRun(runId: string): Promise<Run> {
    const data = await request<Run>(`/api/runs/${runId}`);
    return RunSchema.parse(data);
  },
};
