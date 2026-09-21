import { useState, useEffect, useCallback } from 'react';
import type { DolarType } from './useDolarRate';

const PREF_KEY = 'expenses:dolarType';

const VALID: DolarType[] = [
  'blue',
  'oficial',
  'tarjeta',
  'bolsa',
  'contadoconliqui',
  'mayorista',
  'cripto',
];

function loadPref(): DolarType {
  try {
    const saved = localStorage.getItem(PREF_KEY);
    if (saved && (VALID as string[]).includes(saved)) return saved as DolarType;
  } catch {
    /* ignore */
  }
  return 'blue';
}

/**
 * Hook global para leer/setear el tipo de dólar preferido del usuario.
 * Persistido en localStorage. Compartido entre UsdConversion (display)
 * y los forms (para snapshot de cotización al guardar).
 */
export function useDolarPref(): [DolarType, (t: DolarType) => void] {
  const [type, setTypeState] = useState<DolarType>(loadPref);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, type);
    } catch {
      /* ignore */
    }
  }, [type]);

  const setType = useCallback((t: DolarType) => setTypeState(t), []);
  return [type, setType];
}
