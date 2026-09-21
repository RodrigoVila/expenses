/**
 * Entry point para desarrollo LOCAL (npm run dev).
 * En producción (Vercel) el entry es api/index.ts y este archivo NO se usa.
 */
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  await connectDB();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[server] escuchando en http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[bootstrap] error', err);
  process.exit(1);
});
