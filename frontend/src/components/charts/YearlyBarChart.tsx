import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatMoney } from '@/lib/format';
import type { Currency, YearlyMonth } from '@/lib/types';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface YearlyBarChartProps {
  data: YearlyMonth[];
  currency?: Currency;
  height?: number;
}

/**
 * Bar chart 12 meses:
 * - Barras verdes: ingresos.
 * - Barras rojas: gastos (mostrados como valor positivo pero color distinto).
 * - Overlay: línea/dot con balance del mes.
 */
export function YearlyBarChart({ data, currency = 'ARS', height = 260 }: YearlyBarChartProps) {
  const chartData = data.map((d) => ({
    month: MONTH_LABELS[d.month - 1],
    Ingresos: d.totalIncome,
    Gastos: d.totalExpense,
    Balance: d.balance,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => compactMoney(v)}
          />
          <ReferenceLine y={0} stroke="currentColor" opacity={0.3} />
          <Tooltip
            cursor={{ fill: 'currentColor', opacity: 0.05 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const ingresos = payload.find((p) => p.dataKey === 'Ingresos')?.value as number ?? 0;
              const gastos = payload.find((p) => p.dataKey === 'Gastos')?.value as number ?? 0;
              const balance = ingresos - gastos;
              return (
                <div className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 text-xs shadow-lg space-y-0.5">
                  <div className="font-semibold mb-1">{label}</div>
                  <div>Ingresos: {formatMoney(ingresos, currency)}</div>
                  <div>Gastos: {formatMoney(gastos, currency)}</div>
                  <div className="pt-1 border-t border-white/20 dark:border-slate-900/20">
                    Balance: {formatMoney(balance, currency)}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function compactMoney(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}
