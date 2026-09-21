import { Trash2, Pencil } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Category, Transaction } from '@/lib/types';

interface TransactionListItemProps {
  tx: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

function resolveCat(tx: Transaction): Category | null {
  return typeof tx.categoryId === 'string' ? null : tx.categoryId;
}

export function TransactionListItem({ tx, onEdit, onDelete }: TransactionListItemProps) {
  const cat = resolveCat(tx);
  const isExpense = tx.type === 'expense';

  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <CategoryIcon
        name={cat?.icon ?? 'circle-help'}
        color={cat?.color ?? '#64748B'}
        containerSize={40}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {tx.description || cat?.name || 'Movimiento'}
        </div>
        <div className="text-xs text-slate-500">
          {cat?.name ?? 'Sin categoría'}
          {tx.recurringId && ' · fijo'}
        </div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            'font-semibold whitespace-nowrap',
            isExpense
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400'
          )}
        >
          {isExpense ? '-' : '+'}
          {formatMoney(tx.amount, tx.currency)}
        </div>
        {tx.currency === 'USD' && tx.arsAmount > 0 && (
          <div className="text-[10px] text-slate-500">
            ≈ {formatMoney(tx.arsAmount, 'ARS')}
          </div>
        )}
        {(onEdit || onDelete) && (
          <div className="flex justify-end gap-1 mt-1">
            {onEdit && (
              <button
                onClick={() => onEdit(tx)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Editar"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(tx)}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                aria-label="Borrar"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
