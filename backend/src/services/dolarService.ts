/**
 * Cliente para dolarapi.com desde el backend.
 * Cache en memoria por 5 minutos para no golpear el API en cada request.
 * Usado principalmente por generateFromRecurring para snapshottear el rate.
 */

export type DolarType =
  | 'blue'
  | 'oficial'
  | 'tarjeta'
  | 'bolsa'
  | 'contadoconliqui'
  | 'mayorista'
  | 'cripto';

interface DolarRate {
  venta: number;
  fechaActualizacion: string;
}

interface CachedRate {
  rate: DolarRate;
  fetchedAt: number;
}

const cache = new Map<DolarType, CachedRate>();
const TTL_MS = 5 * 60 * 1000; // 5 min

export const dolarService = {
  async getRate(type: DolarType): Promise<DolarRate> {
    const cached = cache.get(type);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      return cached.rate;
    }
    const res = await fetch(`https://dolarapi.com/v1/dolares/${type}`);
    if (!res.ok) {
      throw new Error(`dolarapi respondió ${res.status} para ${type}`);
    }
    const rate = (await res.json()) as DolarRate;
    cache.set(type, { rate, fetchedAt: Date.now() });
    return rate;
  },
};
