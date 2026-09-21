import { useState, useId } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { UsdConversion } from '@/components/UsdConversion';
import { useRecentDescriptions } from '@/hooks/useTransactions';
import { useDolarPref } from '@/hooks/useDolarPref';
import { useDolarRate } from '@/hooks/useDolarRate';
import { cn } from '@/lib/cn';
import type { Currency, Transaction, TransactionType } from '@/lib/types';

export interface TransactionFormValues {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: string; // YYYY-MM-DD
  currency: Currency;
  arsAmount: number;
  exchangeRate: number | null;
  rateSource: string | null;
}

interface TransactionFormProps {
  initial?: Partial<TransactionFormValues>;
  submitting?: boolean;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(initial?.amount?.toString() ?? '');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState<string>(initial?.date ?? todayISODate());
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'ARS');
  const [error, setError] = useState<string | null>(null);

  const { data: recentDescriptions = [] } = useRecentDescriptions(type);
  const datalistId = useId();

  // Cotización actual del tipo de dólar preferido — se usa al submit para
  // snapshottear arsAmount cuando el movimiento es en USD.
  const [dolarType] = useDolarPref();
  const dolar = useDolarRate(dolarType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!categoryId) {
      setError('Elegí una categoría');
      return;
    }

    // Snapshot de la cotización para USD
    let arsAmount = parsedAmount;
    let exchangeRate: number | null = null;
    let rateSource: string | null = null;
    if (currency === 'USD') {
      if (!dolar.data) {
        setError('No se pudo obtener la cotización del dólar. Intentá de nuevo en unos segundos.');
        return;
      }
      exchangeRate = dolar.data.venta;
      rateSource = dolarType;
      arsAmount = parsedAmount * exchangeRate;
    }

    onSubmit({
      amount: parsedAmount,
      type,
      categoryId,
      description: description.trim(),
      date,
      currency,
      arsAmount,
      exchangeRate,
      rateSource,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle Gasto/Ingreso */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <TypeToggleButton
          active={type === 'expense'}
          onClick={() => setType('expense')}
          label="Gasto"
          color="text-red-600"
        />
        <TypeToggleButton
          active={type === 'income'}
          onClick={() => setType('income')}
          label="Ingreso"
          color="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="col-span-2"
          autoFocus
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
        label="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
        list={datalistId}
        autoComplete="off"
      />
      <datalist id={datalistId}>
        {recentDescriptions.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <Input
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

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

function TypeToggleButton({
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

/** Helper para convertir un Transaction a los valores del form (para editar). */
export function transactionToFormValues(tx: Transaction): TransactionFormValues {
  const catId = typeof tx.categoryId === 'string' ? tx.categoryId : tx.categoryId._id;
  return {
    amount: tx.amount,
    type: tx.type,
    categoryId: catId,
    description: tx.description,
    date: tx.date.slice(0, 10),
    currency: tx.currency,
    arsAmount: tx.arsAmount,
    exchangeRate: tx.exchangeRate,
    rateSource: tx.rateSource,
  };
}
