import { useDolarRate, type DolarType } from '@/hooks/useDolarRate';
import { useDolarPref } from '@/hooks/useDolarPref';
import { formatMoney } from '@/lib/format';

const OPTIONS: { value: DolarType; label: string }[] = [
  { value: 'blue', label: 'Blue' },
  { value: 'oficial', label: 'Oficial' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'bolsa', label: 'MEP (Bolsa)' },
  { value: 'contadoconliqui', label: 'CCL' },
  { value: 'mayorista', label: 'Mayorista' },
  { value: 'cripto', label: 'Cripto' },
];

interface UsdConversionProps {
  amount: number;
}

/**
 * Conversión USD→ARS con dropdown de tipo de dólar.
 * El dropdown SIEMPRE se muestra (aún con error/loading) para que
 * el usuario pueda cambiar de tipo si el que eligió falla.
 * Preferencia persistida en localStorage vía useDolarPref (compartida
 * con los forms para el snapshot al guardar).
 */
export function UsdConversion({ amount }: UsdConversionProps) {
  const [type, setType] = useDolarPref();
  const dolar = useDolarRate(type);

  const usdInArs =
    dolar.data && amount > 0 ? amount * dolar.data.venta : null;

  return (
    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
      {usdInArs !== null && dolar.data && (
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
      {dolar.isLoading ? (
        <span>· cargando...</span>
      ) : dolar.error || !dolar.data ? (
        <span className="text-red-500">· sin datos</span>
      ) : (
        <span>
          · ${dolar.data.venta.toLocaleString('es-AR')} · act.{' '}
          {new Date(dolar.data.fechaActualizacion).toLocaleString('es-AR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  );
}
