import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import { useSummaryComparison } from '@/hooks/useTransactions';
import { useBudgetProgress } from '@/hooks/useCategories';
import { useRecurring } from '@/hooks/useRecurring';
import { useDolarPref } from '@/hooks/useDolarPref';
import { useDolarRate } from '@/hooks/useDolarRate';
import { MonthPicker } from '@/components/MonthPicker';
import { MonthActions } from '@/components/MonthActions';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MonthlyPieChart } from '@/components/charts/MonthlyPieChart';
import { ComparisonChip } from '@/components/ComparisonChip';
import { BudgetProgressList } from '@/components/BudgetProgressList';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Wallet, ArrowDown, Sparkles } from 'lucide-react';
import type { CategoryDelta } from '@/lib/types';

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function Dashboard() {
  const { year, month, prev, next } = useCurrentMonth();
  const { data, isLoading } = useSummaryComparison(year, month);
  const { data: budgets = [] } = useBudgetProgress(year, month, 'ARS');
  const { data: recurring = [] } = useRecurring();
  const [dolarType] = useDolarPref();
  const dolar = useDolarRate(dolarType);

  const current = data?.current;
  const previous = data?.previous;
  const categoryDeltas = data?.categoryDeltas ?? [];

  const pv = prevMonth(year, month);

  // Equivalente en USD del balance/gastos/ingresos usando la cotización actual
  const usdRate = dolar.data?.venta;
  const balanceUsd = current && usdRate ? current.balance / usdRate : null;
  const expenseUsd = current && usdRate ? current.totalExpense / usdRate : null;
  const incomeUsd = current && usdRate ? current.totalIncome / usdRate : null;

  const isEmptyMonth = !isLoading && current?.count === 0;
  const isFirstTime = isEmptyMonth && (previous?.count ?? 0) === 0;
  const hasRecurring = recurring.length > 0;
  const hasPrevData = (previous?.count ?? 0) > 0;

  // Empty state para primer uso
  if (isFirstTime && !hasRecurring) {
    return (
      <div className="space-y-6">
        <MonthPicker year={year} month={month} onPrev={prev} onNext={next} />
        <FirstTimeWelcome />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MonthPicker year={year} month={month} onPrev={prev} onNext={next} />

      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 shadow-lg">
        <div className="flex items-center gap-2 text-brand-100 text-sm mb-1">
          <Wallet size={16} />
          <span>Balance del mes</span>
        </div>
        <div className="text-3xl font-bold">
          {formatMoney(current?.balance ?? 0, 'ARS')}
        </div>
        {balanceUsd !== null && (
          <div className="text-sm text-brand-100 mt-0.5">
            ≈ {formatMoney(balanceUsd, 'USD')} <span className="opacity-70">(dólar {dolarType})</span>
          </div>
        )}

        <div className="mt-2">
          {current && previous && (
            <ComparisonChip
              currentTotal={current.totalExpense}
              previousTotal={previous.totalExpense}
              previousYear={pv.year}
              previousMonth={pv.month}
              metric="expense"
              className="!bg-white/15 !text-white"
            />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatMini
            label="Ingresos"
            amount={current?.totalIncome ?? 0}
            usdAmount={incomeUsd}
            icon={<TrendingUp size={14} />}
            positive
          />
          <StatMini
            label="Gastos"
            amount={current?.totalExpense ?? 0}
            usdAmount={expenseUsd}
            icon={<TrendingDown size={14} />}
          />
        </div>
      </div>

      {/* Acciones rápidas de mes — solo si tiene sentido mostrarlas */}
      {(hasRecurring || hasPrevData) && (
        <MonthActions
          year={year}
          month={month}
          showGenerate={hasRecurring}
          showCopy={hasPrevData}
        />
      )}

      {/* Presupuestos del mes */}
      {budgets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Presupuestos
          </h2>
          <BudgetProgressList items={budgets} currency="ARS" />
        </section>
      )}

      {/* Breakdown por categoría */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Gastos por categoría
        </h2>
        {isLoading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : categoryDeltas.filter((c) => c.current > 0).length === 0 ? (
          <EmptyBreakdown />
        ) : (
          <>
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
            <ul className="space-y-2">
              {categoryDeltas
                .filter((c) => c.current > 0)
                .map((item) => (
                  <CategoryBreakdownRow
                    key={item.categoryId}
                    item={item}
                    totalExpense={current?.totalExpense ?? 0}
                  />
                ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function StatMini({
  label,
  amount,
  usdAmount,
  icon,
  positive,
}: {
  label: string;
  amount: number;
  usdAmount?: number | null;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur p-3">
      <div className="flex items-center gap-1 text-xs text-brand-100">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('text-lg font-semibold mt-0.5', positive && 'text-emerald-200')}>
        {formatMoney(amount, 'ARS')}
      </div>
      {usdAmount != null && (
        <div className="text-[10px] text-brand-100/80">≈ {formatMoney(usdAmount, 'USD')}</div>
      )}
    </div>
  );
}

function CategoryBreakdownRow({
  item,
  totalExpense,
}: {
  item: CategoryDelta;
  totalExpense: number;
}) {
  const pct = totalExpense > 0 ? (item.current / totalExpense) * 100 : 0;

  return (
    <li className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
      <CategoryIcon name={item.categoryIcon} color={item.categoryColor} containerSize={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium truncate">{item.categoryName}</span>
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatMoney(item.current, 'ARS')}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: item.categoryColor }}
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums w-10 text-right">
            {pct.toFixed(0)}%
          </span>
        </div>
        {item.previous > 0 && item.deltaPct !== null && Math.abs(item.deltaPct) >= 5 && (
          <div className="mt-1">
            <MiniDelta pct={item.deltaPct} />
          </div>
        )}
      </div>
    </li>
  );
}

function MiniDelta({ pct }: { pct: number }) {
  const isUp = pct > 0;
  return (
    <span
      className={cn(
        'text-[10px] font-medium',
        isUp ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
      )}
    >
      {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% vs mes anterior
    </span>
  );
}

function EmptyBreakdown() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
      Aún no hay gastos en este mes.
    </div>
  );
}

function FirstTimeWelcome() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6 shadow-lg space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={20} />
        <h2 className="text-xl font-bold">¡Bienvenido a Expenses!</h2>
      </div>
      <p className="text-sm text-brand-100">
        Empezá cargando tu primer movimiento. Tocá el botón <b>+</b> abajo a la derecha para
        registrar un ingreso o gasto.
      </p>
      <div className="text-sm text-brand-100 space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-brand-200">•</span>
          <span>
            Con el <b>+</b> también podés crear <b>fijos</b> (alquiler, sueldo, Netflix) que se
            repiten cada mes.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-brand-200">•</span>
          <span>
            En <b>Categorías</b> podés ajustar íconos, colores y presupuestos mensuales.
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 text-brand-100 pt-2">
        <span className="text-xs">Empezá acá</span>
        <ArrowDown size={16} className="animate-bounce" />
      </div>
    </div>
  );
}
