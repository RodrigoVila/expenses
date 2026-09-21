import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { IconPicker } from '@/components/IconPicker';
import { ColorPicker } from '@/components/ColorPicker';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { Category, CategoryType } from '@/lib/types';

export interface CategoryFormValues {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  monthlyBudget: number;
}

interface CategoryFormProps {
  initial?: Partial<CategoryFormValues>;
  submitting?: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel?: () => void;
}

export function CategoryForm({ initial, submitting, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'shopping-cart');
  const [color, setColor] = useState(initial?.color ?? '#6366F1');
  const [type, setType] = useState<CategoryType>(initial?.type ?? 'expense');
  const [monthlyBudget, setMonthlyBudget] = useState<string>(
    initial?.monthlyBudget ? String(initial.monthlyBudget) : ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Poné un nombre');
      return;
    }
    const parsedBudget = Number(monthlyBudget) || 0;
    if (parsedBudget < 0) {
      setError('El presupuesto no puede ser negativo');
      return;
    }
    setError(null);
    onSubmit({ name: name.trim(), icon, color, type, monthlyBudget: parsedBudget });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
        <CategoryIcon name={icon} color={color} containerSize={48} />
        <div>
          <div className="font-medium">{name || 'Nombre de la categoría'}</div>
          <div className="text-xs text-slate-500 capitalize">
            {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Ambos'}
          </div>
        </div>
      </div>

      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        autoFocus
      />

      <Select
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as CategoryType)}
      >
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
        <option value="both">Ambos</option>
      </Select>

      {type !== 'income' && (
        <Input
          label="Presupuesto mensual (opcional)"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={monthlyBudget}
          onChange={(e) => setMonthlyBudget(e.target.value)}
          hint="Se usa para mostrar el progreso del mes. 0 o vacío = sin presupuesto."
        />
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Color
        </label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ícono
        </label>
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </div>

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

export function categoryToFormValues(c: Category): CategoryFormValues {
  return {
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
    monthlyBudget: c.monthlyBudget,
  };
}
