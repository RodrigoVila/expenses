import { useQuery } from '@tanstack/react-query';

export type DolarType = 'blue' | 'oficial' | 'tarjeta' | 'mep' | 'ccl' | 'mayorista';

export interface DolarRate {
  moneda: string;
  casa: DolarType;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

/**
 * Trae la cotización USD/ARS desde dolarapi.com (gratis, sin auth).
 * - staleTime alto porque la cotización no cambia tanto en el corto plazo.
 * - Fetch directo (no usa el api.ts para no adjuntar Authorization).
 */
export function useDolarRate(type: DolarType = 'blue') {
  return useQuery({
    queryKey: ['dolar-rate', type],
    queryFn: async (): Promise<DolarRate> => {
      const res = await fetch(`https://dolarapi.com/v1/dolares/${type}`);
      if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
}
