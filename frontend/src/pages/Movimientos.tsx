import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { MonthPicker } from '@/components/MonthPicker';
import { TransactionListItem } from '@/components/TransactionListItem';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatLongDate } from '@/lib/format';
import type { Transaction, TransactionType } from '@/lib/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

type TypeFilter = 'all' | TransactionType;

export function Movimientos() {
  const { year, month, prev, next } = useCurrentMonth();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useTransactions({
    year,
    month,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });
  const deleteMut = useDeleteTransaction();

  const grouped = useMemo(() => groupByDay(transactions), [transactions]);

  return (
    <div className="space-y-4">
      <MonthPicker year={year} month={month} onPrev={prev} onNext={next} />

      <div className="flex gap-2">
        <Select
          className="flex-1"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">Todos</option>
          <option value="expense">Solo gastos</option>
          <option value="income">Solo ingresos</option>
        </Select>
        <a
          href={`${API_BASE}/transactions/export.csv?year=${year}&month=${month}${typeFilter !== 'all' ? `&type=${typeFilter}` : ''}`}
          download
          className="shrink-0"
        >
          <Button variant="secondary" size="md" type="button">
            <Download size={16} />
            CSV
          </Button>
        </a>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
          Sin movimientos en este mes. Tocá el botón <b>+</b> para agregar el primero.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ dateKey, items }) => (
            <section key={dateKey}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 px-1">
                {formatLongDate(items[0].date)}
              </h3>
              <ul className="space-y-2">
                {items.map((tx) => (
                  <TransactionListItem
                    key={tx._id}
                    tx={tx}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <TransactionFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        transaction={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        title="¿Borrar movimiento?"
        message="Esta acción no se puede deshacer."
        danger
        confirmLabel="Borrar"
        loading={deleteMut.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteMut.mutateAsync(deleting._id);
            setDeleting(null);
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

interface DayGroup {
  dateKey: string;
  items: Transaction[];
}

function groupByDay(txs: Transaction[]): DayGroup[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = tx.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, items]) => ({ dateKey, items }));
}
