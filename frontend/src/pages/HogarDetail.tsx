import { useMemo, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import {
  useSummaryComparison,
  useTransactions,
  useDeleteTransaction,
} from '@/hooks/useTransactions';
import { useRecurring } from '@/hooks/useRecurring';
import { MonthPicker } from '@/components/MonthPicker';
import { MonthlyPieChart } from '@/components/charts/MonthlyPieChart';
import { TransactionListItem } from '@/components/TransactionListItem';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatMoney, formatLongDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Transaction } from '@/lib/types';

/**
 * Vista de un hogar particular:
 * - Header con nombre + miembros
 * - Selector de mes
 * - Balance del hogar
 * - Desglose por categoría (pie)
 * - Movimientos del mes (agrupados por día)
 *
 * Los FABs del Layout detectan que estamos en /hogar/:id y crean scoped al hogar.
 */
export function HogarDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: households = [], isLoading: hLoading } = useHouseholds();
  const household = households.find((h) => h._id === id);

  const { year, month, prev, next } = useCurrentMonth();
  const { data: cmp, isLoading: cmpLoading } = useSummaryComparison(year, month, id);
  const { data: transactions = [] } = useTransactions({ year, month, householdId: id });
  const { data: recurring = [] } = useRecurring(false, id);

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const deleteMut = useDeleteTransaction();

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const key = tx.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([, items]) => items);
  }, [transactions]);

  if (hLoading) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }
  if (!household) {
    return <Navigate to="/hogar" replace />;
  }

  const current = cmp?.current;
  const categoryDeltas = cmp?.categoryDeltas ?? [];

  return (
    <div className="space-y-5">
      {/* Header con back */}
      <div className="flex items-center gap-2">
        <Link
          to="/hogar"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Volver a hogares"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold truncate">{household.name}</div>
          <Link
            to="/hogar"
            className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Users size={12} />
            {household.members.length} miembro{household.members.length !== 1 ? 's' : ''}
          </Link>
        </div>
      </div>

      <MonthPicker year={year} month={month} onPrev={prev} onNext={next} />

      {/* Balance del hogar */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
          <Wallet size={16} />
          <span>Balance del hogar</span>
        </div>
        <div className="text-3xl font-bold">{formatMoney(current?.balance ?? 0, 'ARS')}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatMini
            label="Ingresos"
            amount={current?.totalIncome ?? 0}
            icon={<TrendingUp size={14} />}
            positive
          />
          <StatMini
            label="Gastos"
            amount={current?.totalExpense ?? 0}
            icon={<TrendingDown size={14} />}
          />
        </div>
      </div>

      {/* Breakdown por categoría */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Gastos por categoría
        </h2>
        {cmpLoading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : categoryDeltas.filter((c) => c.current > 0).length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
            Sin gastos este mes en el hogar.
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
            <MonthlyPieChart
              data={categoryDeltas
                .filter((c) => c.current > 0)
                .map((c) => ({
                  categoryId: c.categoryId,
                  categoryName: c.categoryName,
                  categoryIcon: c.categoryIcon,
                  categoryColor: c.categoryColor,
                  total: c.current,
                  count: 0,
                }))}
              currency="ARS"
            />
          </div>
        )}
      </section>

      {/* Fijos activos del hogar (info compacta) */}
      {recurring.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Fijos del hogar ({recurring.length})
          </h2>
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-300">
            {recurring.filter((r) => r.isActive).length} activos, se generan automáticamente cuando
            los sumás al mes desde el <b>+</b>.
          </div>
        </section>
      )}

      {/* Movimientos del mes */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Movimientos del mes
        </h2>
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
            Sin movimientos. Tocá el <b>+</b> para cargar el primero al hogar.
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((items) => (
              <section key={items[0].date}>
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
      </section>

      <TransactionFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        transaction={editing}
        householdId={id}
      />

      <ConfirmDialog
        open={!!deleting}
        title="¿Borrar movimiento?"
        message="Esta acción no se puede deshacer. El movimiento se borra para todos los miembros del hogar."
        danger
        confirmLabel="Borrar"
        loading={deleteMut.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteMut.mutateAsync({ id: deleting._id, householdId: id });
            setDeleting(null);
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function StatMini({
  label,
  amount,
  icon,
  positive,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur p-3">
      <div className="flex items-center gap-1 text-xs text-emerald-100">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('text-lg font-semibold mt-0.5', positive && 'text-emerald-100')}>
        {formatMoney(amount, 'ARS')}
      </div>
    </div>
  );
}
