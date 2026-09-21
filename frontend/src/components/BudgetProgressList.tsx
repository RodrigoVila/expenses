import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BudgetProgressItem, Currency } from '@/lib/types';

interface BudgetProgressListProps {
  items: BudgetProgressItem[];
  currency?: Currency;
}

/**
 * Lista de presupuestos con barras coloreadas según estado:
 * - ok (verde): <70%
 * - warning (amarillo): 70-99%
 * - exceeded (rojo): >=100%
 */
export function BudgetProgressList({ items, currency = 'ARS' }: BudgetProgressListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center text-sm text-slate-500">
        Aún no tenés presupuestos. Editá una categoría y ponele un monto mensual.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <BudgetRow key={item.categoryId} item={item} currency={currency} />
      ))}
    </ul>
  );
}

function BudgetRow({ item, currency }: { item: BudgetProgressItem; currency: Currency }) {
  const pctClamped = Math.min(item.percentage, 100);
  const overflowed = item.percentage > 100;

  const statusColor =
    item.status === 'exceeded'
      ? 'bg-red-500'
      : item.status === 'warning'
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const StatusIcon =
    item.status === 'exceeded'
      ? XCircle
      : item.status === 'warning'
      ? AlertTriangle
      : CheckCircle2;

  const statusTextColor =
    item.status === 'exceeded'
      ? 'text-red-600 dark:text-red-400'
      : item.status === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <li className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
      <div className="flex items-center gap-3">
        <CategoryIcon name={item.categoryIcon} color={item.categoryColor} containerSize={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium truncate">{item.categoryName}</span>
            <span className="text-xs text-slate-500 tabular-nums">
              {formatMoney(item.spent, currency)} / {formatMoney(item.budget, currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={cn('h-full transition-all', statusColor)}
            style={{ width: `${pctClamped}%` }}
          />
        </div>
        <StatusIcon size={14} className={statusTextColor} />
        <span className={cn('text-xs font-semibold tabular-nums w-12 text-right', statusTextColor)}>
          {Math.round(item.percentage)}%
        </span>
      </div>

      {overflowed && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          Te pasaste por {formatMoney(-item.remaining, currency)}
        </div>
      )}
    </li>
  );
}
