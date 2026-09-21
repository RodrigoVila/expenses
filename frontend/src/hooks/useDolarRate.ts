import { useQuery } from '@tanstack/react-query';

/** Nombres tal como los espera la URL de dolarapi.com. */
export type DolarType =
  | 'blue'
  | 'oficial'
  | 'bolsa'          // MEP
  | 'contadoconliqui' // CCL
  | 'tarjeta'
  | 'mayorista'
  | 'cripto';

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
 * Endpoints:
 * - /v1/dolares/blue
 * - /v1/dolares/oficial
 * - /v1/dolares/bolsa           (aka MEP)
 * - /v1/dolares/contadoconliqui (aka CCL)
 * - /v1/dolares/tarjeta
 * - /v1/dolares/mayorista
 * - /v1/dolares/cripto
 */
export function useDolarRate(type: DolarType = 'blue') {
  return useQuery({
    queryKey: ['dolar-rate', type],
    queryFn: async (): Promise<DolarRate> => {
      const res = await fetch(`https://dolarapi.com/v1/dolares/${type}`);
      if (!res.ok) throw new Error(`dolarapi respondió ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
