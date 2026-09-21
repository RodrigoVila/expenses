import { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useYearlySummary } from '@/hooks/useTransactions';
import { YearlyBarChart } from '@/components/charts/YearlyBarChart';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

export function Anual() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const { data = [], isLoading } = useYearlySummary(year, 'ARS');

  const totalIncome = data.reduce((a, m) => a + m.totalIncome, 0);
  const totalExpense = data.reduce((a, m) => a + m.totalExpense, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Year picker */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Año anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-lg font-semibold">{year}</div>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Año siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Totales del año */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 shadow-lg">
        <div className="flex items-center gap-2 text-brand-100 text-sm mb-1">
          <Wallet size={16} />
          <span>Balance del año</span>
        </div>
        <div
          className={cn(
            'text-3xl font-bold',
            balance < 0 && 'text-red-200'
          )}
        >
          {formatMoney(balance, 'ARS')}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatMini
            label="Ingresos"
            amount={totalIncome}
            icon={<TrendingUp size={14} />}
            positive
          />
          <StatMini
            label="Gastos"
            amount={totalExpense}
            icon={<TrendingDown size={14} />}
          />
        </div>
      </div>

      {/* Bar chart */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Mes a mes
        </h2>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          {isLoading ? (
            <div className="text-sm text-slate-500 py-8 text-center">Cargando...</div>
          ) : (
            <YearlyBarChart data={data} currency="ARS" />
          )}
        </div>
      </section>
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
      <div className="flex items-center gap-1 text-xs text-brand-100">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('text-lg font-semibold mt-0.5', positive && 'text-emerald-200')}>
        {formatMoney(amount, 'ARS')}
      </div>
    </div>
  );
}
