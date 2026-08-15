import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { computeDealershipData } from './server/analyticsService.js';
import { askDealershipAi } from './server/geminiService.js';
import {
  aiRateLimiter,
  generalRateLimiter,
  refreshRateLimiter,
} from './server/middleware/rateLimiter.js';
import {
  fetchDealershipSheetsData,
  getLocalStore,
  resetLocalStore,
  setCustomSpreadsheetId,
  updateLocalAssumptions,
} from './server/sheetsService.js';
import {
  sanitizeAiQuestion,
  sanitizeAssumptionsPayload,
  sanitizeErrorMessage,
  sanitizeSpreadsheetId,
} from './server/utils/sanitizer.js';
import { Assumptions } from './src/types/dealership.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Disable x-powered-by to prevent server finger-printing
    res.removeHeader('X-Powered-By');
    next();
  });

  // Limit JSON body payload size to prevent DoS attacks
  app.use(express.json({ limit: '200kb' }));

  // Apply general rate limiting across all API endpoints
  app.use('/api', generalRateLimiter);

  // API 1: Get full dashboard data
  app.get('/api/dealership/data', async (req: Request, res: Response) => {
    try {
      const rawSpreadsheetId = req.query.spreadsheetId;
      const sanitizedSpreadsheetId = rawSpreadsheetId
        ? sanitizeSpreadsheetId(rawSpreadsheetId)
        : undefined;

      const sheetResult = await fetchDealershipSheetsData(sanitizedSpreadsheetId || undefined);

      const dashboard = computeDealershipData(
        sheetResult.inventory,
        sheetResult.leads,
        sheetResult.assumptions,
        {
          type: sheetResult.sourceType,
          spreadsheetId: sheetResult.spreadsheetId,
          isMockOrFallback: !!sheetResult.error,
        }
      );

      res.json(dashboard);
    } catch (err: any) {
      console.error('[API /dealership/data Error]:', sanitizeErrorMessage(err));
      res.status(500).json({ error: sanitizeErrorMessage(err, 'Failed to fetch dealership data') });
    }
  });

  // API 1b: Manual refresh trigger with refresh rate limiter
  app.post('/api/dealership/refresh', refreshRateLimiter, async (req: Request, res: Response) => {
    try {
      const rawSpreadsheetId = req.body?.spreadsheetId;
      const sanitizedSpreadsheetId = rawSpreadsheetId
        ? sanitizeSpreadsheetId(rawSpreadsheetId)
        : undefined;

      const sheetResult = await fetchDealershipSheetsData(sanitizedSpreadsheetId || undefined);

      const dashboard = computeDealershipData(
        sheetResult.inventory,
        sheetResult.leads,
        sheetResult.assumptions,
        {
          type: sheetResult.sourceType,
          spreadsheetId: sheetResult.spreadsheetId,
          isMockOrFallback: !!sheetResult.error,
        }
      );

      res.json({
        success: true,
        refreshedAt: new Date().toISOString(),
        source: sheetResult.sourceType,
        dashboard,
      });
    } catch (err: any) {
      console.error('[API /dealership/refresh Error]:', sanitizeErrorMessage(err));
      res.status(500).json({ error: sanitizeErrorMessage(err, 'Failed to refresh Google Sheets data') });
    }
  });

  // API 2: Update Assumptions with input validation & sanitization
  app.post('/api/dealership/assumptions', async (req: Request, res: Response) => {
    try {
      const store = getLocalStore();
      const rawPayload = req.body;

      if (!rawPayload || typeof rawPayload !== 'object') {
        res.status(400).json({ error: 'Invalid assumptions payload format' });
        return;
      }

      // Sanitize and clamp all numeric values, stages, and markdown steps
      const sanitizedAssumptions = sanitizeAssumptionsPayload(rawPayload, store.assumptions);

      updateLocalAssumptions(sanitizedAssumptions);
      const updatedStore = getLocalStore();

      const dashboard = computeDealershipData(
        updatedStore.inventory,
        updatedStore.leads,
        sanitizedAssumptions,
        {
          type: 'live_dataset',
          isMockOrFallback: false,
        }
      );

      res.json(dashboard);
    } catch (err: any) {
      console.error('[API /dealership/assumptions Error]:', sanitizeErrorMessage(err));
      res.status(500).json({ error: sanitizeErrorMessage(err, 'Failed to update assumptions') });
    }
  });

  // API 3: Plain-English Ask Feature with AI rate limiting & input sanitization
  app.post('/api/dealership/ask', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { question: rawQuestion, assumptionsOverride } = req.body || {};
      
      const cleanQuestion = sanitizeAiQuestion(rawQuestion);
      if (!cleanQuestion || cleanQuestion.length < 2) {
        res.status(400).json({ error: 'A valid question string is required (minimum 2 characters).' });
        return;
      }

      const store = getLocalStore();
      const cleanAssumptions = assumptionsOverride
        ? sanitizeAssumptionsPayload(assumptionsOverride, store.assumptions)
        : store.assumptions;

      const dashboard = computeDealershipData(
        store.inventory,
        store.leads,
        cleanAssumptions,
        {
          type: 'live_dataset',
          isMockOrFallback: false,
        }
      );

      const aiResponse = await askDealershipAi(cleanQuestion, dashboard);
      res.json(aiResponse);
    } catch (err: any) {
      console.error('[API /dealership/ask Error]:', sanitizeErrorMessage(err));
      res.status(500).json({
        chartType: 'bar',
        title: 'Dealership Query Error',
        data: [],
        xKey: '',
        yKeys: [],
        insight: "Couldn't process that query. Try naming a metric like forecast, markdown, sales, inventory, or leads.",
        error: sanitizeErrorMessage(err, 'AI query processing failed'),
      });
    }
  });

  // API 4: Connect custom Google Spreadsheet ID with strict format validation
  app.post('/api/dealership/sync', refreshRateLimiter, async (req: Request, res: Response) => {
    try {
      const { spreadsheetId: rawId } = req.body || {};
      
      let sanitizedId: string | null = null;
      if (rawId !== undefined && rawId !== '') {
        sanitizedId = sanitizeSpreadsheetId(rawId);
        if (!sanitizedId) {
          res.status(400).json({
            error: 'Invalid Google Spreadsheet ID. ID must be 20-100 alphanumeric characters, dashes, or underscores.',
          });
          return;
        }
        setCustomSpreadsheetId(sanitizedId);
      }

      const sheetResult = await fetchDealershipSheetsData(sanitizedId || undefined);
      const dashboard = computeDealershipData(
        sheetResult.inventory,
        sheetResult.leads,
        sheetResult.assumptions,
        {
          type: sheetResult.sourceType,
          spreadsheetId: sheetResult.spreadsheetId,
          isMockOrFallback: !!sheetResult.error,
        }
      );

      res.json(dashboard);
    } catch (err: any) {
      console.error('[API /dealership/sync Error]:', sanitizeErrorMessage(err));
      res.status(500).json({ error: sanitizeErrorMessage(err, 'Failed to sync Google Sheet') });
    }
  });

  // API 5: Reset to baseline
  app.post('/api/dealership/reset', (req: Request, res: Response) => {
    try {
      resetLocalStore();
      const store = getLocalStore();
      const dashboard = computeDealershipData(
        store.inventory,
        store.leads,
        store.assumptions,
        {
          type: 'live_dataset',
          isMockOrFallback: false,
        }
      );
      res.json(dashboard);
    } catch (err: any) {
      console.error('[API /dealership/reset Error]:', sanitizeErrorMessage(err));
      res.status(500).json({ error: sanitizeErrorMessage(err, 'Failed to reset store') });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoPulse Dealership Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
