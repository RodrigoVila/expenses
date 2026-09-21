import { useState, useEffect } from 'react';
import { useDolarRate, type DolarType } from '@/hooks/useDolarRate';
import { formatMoney } from '@/lib/format';

const PREF_KEY = 'expenses:dolarType';

const OPTIONS: { value: DolarType; label: string }[] = [
  { value: 'blue', label: 'Blue' },
  { value: 'oficial', label: 'Oficial' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mep', label: 'MEP' },
  { value: 'ccl', label: 'CCL' },
];

function loadPref(): DolarType {
  try {
    const saved = localStorage.getItem(PREF_KEY);
    if (saved && OPTIONS.some((o) => o.value === saved)) return saved as DolarType;
  } catch {
    /* ignore */
  }
  return 'blue';
}

interface UsdConversionProps {
  amount: number;
}

/**
 * Muestra la conversión USD→ARS con un dropdown chico para elegir tipo de dólar.
 * La preferencia se guarda en localStorage y persiste entre sesiones.
 */
export function UsdConversion({ amount }: UsdConversionProps) {
  const [type, setType] = useState<DolarType>(loadPref);
  const dolar = useDolarRate(type);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, type);
    } catch {
      /* ignore */
    }
  }, [type]);

  const usdInArs =
    dolar.data && amount > 0 ? amount * dolar.data.venta : null;

  return (
    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
      {dolar.isLoading ? (
        <span>Cargando cotización...</span>
      ) : dolar.error || !dolar.data ? (
        <span className="text-red-500">No se pudo obtener la cotización</span>
      ) : (
        <>
          {usdInArs !== null && (
            <span>
              ≈{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatMoney(usdInArs, 'ARS')}
              </span>
            </span>
          )}
          <span>· dólar</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DolarType)}
            className="bg-transparent border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span>
            ${dolar.data.venta.toLocaleString('es-AR')} · act.{' '}
            {new Date(dolar.data.fechaActualizacion).toLocaleString('es-AR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </>
      )}
    </div>
  );
}
