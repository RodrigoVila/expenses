import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '@/lib/format';
import type { CategoryBreakdown, Currency } from '@/lib/types';

interface MonthlyPieChartProps {
  data: CategoryBreakdown[];
  currency?: Currency;
  height?: number;
}

/**
 * Gráfico de torta con distribución de gastos por categoría del mes.
 * Muestra el total en el centro y tooltip con monto+porcentaje al hover/tap.
 */
export function MonthlyPieChart({
  data,
  currency = 'ARS',
  height = 240,
}: MonthlyPieChartProps) {
  const total = data.reduce((acc, d) => acc + d.total, 0);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-500"
        style={{ height }}
      >
        Sin datos para graficar
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.categoryName,
    value: d.total,
    color: d.categoryColor,
  }));

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0];
              const pct = total > 0 ? ((p.value as number) / total) * 100 : 0;
              return (
                <div className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 text-xs shadow-lg">
                  <div className="font-semibold">{p.name}</div>
                  <div>
                    {formatMoney(p.value as number, currency)} · {pct.toFixed(1)}%
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centro: total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-slate-500">Total</span>
        <span className="font-bold text-lg">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}
