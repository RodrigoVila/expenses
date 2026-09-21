import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMonthYear } from '@/lib/format';

interface ComparisonChipProps {
  currentTotal: number;
  previousTotal: number;
  previousYear: number;
  previousMonth: number;
  /** "gasto" o "ingreso" — cambia la lógica de bueno/malo */
  metric?: 'expense' | 'income' | 'balance';
  className?: string;
}

/**
 * Chip visual comparando total actual vs mes anterior.
 * Para gastos: subir = malo (rojo), bajar = bueno (verde).
 * Para ingresos y balance: al revés.
 */
export function ComparisonChip({
  currentTotal,
  previousTotal,
  previousYear,
  previousMonth,
  metric = 'expense',
  className,
}: ComparisonChipProps) {
  if (previousTotal === 0 && currentTotal === 0) return null;

  const delta = currentTotal - previousTotal;
  const pct = previousTotal === 0 ? null : (delta / Math.abs(previousTotal)) * 100;

  const isDown = delta < 0;
  const isUp = delta > 0;
  const isBad = metric === 'expense' ? isUp : isDown;
  const isGood = metric === 'expense' ? isDown : isUp;

  const label =
    pct === null
      ? previousTotal === 0
        ? 'Sin datos de referencia'
        : ''
      : `${Math.abs(pct).toFixed(0)}% ${isDown ? 'menos' : 'más'} vs ${capitalize(formatMonthYear(previousYear, previousMonth))}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        isGood && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        isBad && 'bg-red-500/15 text-red-700 dark:text-red-300',
        !isBad && !isGood && 'bg-slate-500/10 text-slate-500',
        className
      )}
    >
      {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
      {label}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
