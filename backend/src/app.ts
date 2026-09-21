import express from 'express';
import cors, { type CorsOptions } from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

/**
 * CORS:
 * - En dev: aceptamos cualquier http://localhost:<PORT> (Vite puede saltar de puerto).
 * - En prod: solo los orígenes listados en env.CORS_ORIGIN (coma-separado).
 */
function buildCorsOptions(): CorsOptions {
  const allowedList = env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  const isDev = env.NODE_ENV !== 'production';

  return {
    origin(origin, cb) {
      // requests sin origin (curl, health checks, mismo-origin) → OK
      if (!origin) return cb(null, true);
      if (allowedList.includes(origin)) return cb(null, true);
      if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
      cb(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  };
}

export function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json());

  app.use('/api', routes);

  app.use(errorHandler);

  return app;
}
