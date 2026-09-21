import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';

/**
 * Entry point para Vercel Serverless.
 *
 * Vercel toma cualquier archivo dentro de /api como una función serverless.
 * Nuestro vercel.json reescribe /api/(.*) → /api para que TODO el traffic
 * caiga acá, y Express hace el routing interno con el prefix /api.
 *
 * La app se construye una única vez (fuera del handler) y la conexión a
 * Mongo se cachea en globalThis (ver config/db.ts) para reusar entre
 * invocaciones cuando el contenedor está caliente.
 */
const app = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[serverless] Error conectando a Mongo', err);
    res.status(500).json({ error: 'DB connection error' });
    return;
  }
  // Express es compatible con la firma (req, res) de Vercel.
  return (app as unknown as (req: VercelRequest, res: VercelResponse) => void)(req, res);
}
