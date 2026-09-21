import mongoose from 'mongoose';
import { env } from './env';

/**
 * Cache de conexión para entornos serverless (Vercel).
 * Cada invocación de una función podría abrir una conexión nueva y saturar
 * MongoDB Atlas. Reusamos la promesa/conexión entre invocaciones usando
 * globalThis (persiste mientras el contenedor está caliente).
 */
type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as unknown as {
  __mongooseCache?: CachedConnection;
};

const cached: CachedConnection =
  globalWithMongoose.__mongooseCache ?? { conn: null, promise: null };

if (!globalWithMongoose.__mongooseCache) {
  globalWithMongoose.__mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(env.MONGODB_URI, {
      // buffer off para fallar rápido si la conexión no está lista
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[db] MongoDB conectado');
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
