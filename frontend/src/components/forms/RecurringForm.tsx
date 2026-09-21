import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { UsdConversion } from '@/components/UsdConversion';
import { cn } from '@/lib/cn';
import type { Currency, RecurringTransaction, TransactionType } from '@/lib/types';

export interface RecurringFormValues {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  dayOfMonth: number;
  currency: Currency;
  isActive: boolean;
}

interface RecurringFormProps {
  initial?: Partial<RecurringFormValues>;
  submitting?: boolean;
  onSubmit: (values: RecurringFormValues) => void;
  onCancel?: () => void;
}

export function RecurringForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const isEdit = initial !== undefined;
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.dayOfMonth?.toString() ?? '1');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'ARS');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    const parsedDay = Number(dayOfMonth);
    if (!parsedAmount || parsedAmount <= 0) return setError('Monto inválido');
    if (!categoryId) return setError('Elegí una categoría');
    if (parsedDay < 1 || parsedDay > 31) return setError('El día debe estar entre 1 y 31');
    setError(null);
    onSubmit({
      amount: parsedAmount,
      type,
      categoryId,
      description: description.trim(),
      dayOfMonth: parsedDay,
      currency,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <TypeToggle active={type === 'expense'} onClick={() => setType('expense')} label="Gasto" color="text-red-600" />
        <TypeToggle active={type === 'income'} onClick={() => setType('income')} label="Ingreso" color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="col-span-2"
        />
        <Select
          label="Moneda"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </Select>
      </div>

      {currency === 'USD' && (
        <div className="-mt-2">
          <UsdConversion amount={Number(amount) || 0} />
        </div>
      )}

      <CategoryPicker
        value={categoryId}
        onChange={setCategoryId}
        filterByType={type}
      />

      <Input
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ej: Alquiler, Netflix..."
      />

      <Input
        label="Día del mes"
        type="number"
        inputMode="numeric"
        min="1"
        max="31"
        value={dayOfMonth}
        onChange={(e) => setDayOfMonth(e.target.value)}
        hint="Cuándo cae cada mes (1 = primer día). Si el mes no tiene ese día, cae al último."
      />

      {isEdit && (
        <label className="flex items-center gap-2 text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <input
            type="checkbox"
            checked={!isActive}
            onChange={(e) => setIsActive(!e.target.checked)}
            className="w-4 h-4"
          />
          <span>
            Pausar este fijo
            <span className="block text-xs text-slate-500 font-normal">
              No se va a generar al presionar "Generar fijos" hasta que lo reactives.
            </span>
          </span>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" fullWidth loading={submitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

function TypeToggle({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'py-2 rounded-lg text-sm font-medium transition',
        active
          ? cn('bg-white dark:bg-slate-900 shadow-sm', color)
          : 'text-slate-500 dark:text-slate-400'
      )}
    >
      {label}
    </button>
  );
}

export function recurringToFormValues(r: RecurringTransaction): RecurringFormValues {
  const catId = typeof r.categoryId === 'string' ? r.categoryId : r.categoryId._id;
  return {
    amount: r.amount,
    type: r.type,
    categoryId: catId,
    description: r.description,
    dayOfMonth: r.dayOfMonth,
    currency: r.currency,
    isActive: r.isActive,
  };
}
