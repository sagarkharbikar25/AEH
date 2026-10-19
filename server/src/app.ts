/**
 * POLARIS Express Application
 *
 * Configures Express application, CORS origins, middleware pipelines,
 * and base health checks.
 */

import express, { Express } from 'express';
import cors from 'cors';
import {
  requestIdMiddleware,
  rateLimitMiddleware,
  spendKillSwitchMiddleware,
  errorHandler,
  spendBudget,
} from './middleware/safety.js';
import { apiRouter } from './routes/api.js';
import { raceRouter } from './routes/race.js';

export function createApp(): Express {
  const app = express();

  // CORS configuration allowing frontend dev server and production origins
  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      exposedHeaders: ['x-request-id'],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(rateLimitMiddleware);
  app.use(spendKillSwitchMiddleware);

  // App-level spend status check route
  app.get('/api/spend', (req, res) => {
    res.json({
      spend: spendBudget.getStatus(),
      requestId: req.id,
    });
  });

  // Mount API routers
  app.use('/api', apiRouter);
  app.use('/api/race', raceRouter);
  app.use('/api/runs', raceRouter);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
