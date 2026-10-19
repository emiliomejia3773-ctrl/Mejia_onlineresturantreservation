import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import reservationRoutes from './routes/reservations.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './utils/http.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind a reverse proxy in production, so rate limiting sees the real client IP

  app.use(helmet({ contentSecurityPolicy: false })); // the SPA loads Unsplash images and Google Fonts
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '50kb' }));
  if (!config.isProd) app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api', publicRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // In production this server also serves the built frontend (run `npm run build` in the project root first).
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
  if (config.isProd && fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
