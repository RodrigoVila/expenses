import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '@/hooks/useRecurring';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  RecurringForm,
  recurringToFormValues,
  type RecurringFormValues,
} from '@/components/forms/RecurringForm';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Category, RecurringTransaction } from '@/lib/types';

function resolveCategory(r: RecurringTransaction): Category | null {
  return typeof r.categoryId === 'string' ? null : r.categoryId;
}

export function Fijos() {
  const { data: recurring = [], isLoading } = useRecurring();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null);

  const createMut = useCreateRecurring();
  const updateMut = useUpdateRecurring();
  const deleteMut = useDeleteRecurring();

  const { incomes, expenses } = useMemo(() => {
    return {
      incomes: recurring.filter((r) => r.type === 'income'),
      expenses: recurring.filter((r) => r.type === 'expense'),
    };
  }, [recurring]);

  const handleCreate = async (v: RecurringFormValues) => {
    await createMut.mutateAsync({
      ...v,
      startDate: new Date().toISOString(),
    });
    setCreating(false);
  };

  const handleUpdate = async (v: RecurringFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing._id, input: v });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fijos</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Nuevo
        </Button>
      </div>

      <p className="text-sm text-slate-500">
        Ingresos y gastos que se repiten cada mes. Desde el Dashboard podés generar los
        movimientos del mes con un botón.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : recurring.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
          Aún no tenés fijos. Creá el primero con el botón <b>Nuevo</b>.
        </div>
      ) : (
        <div className="space-y-6">
          <RecurringSection
            title="Ingresos"
            items={incomes}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
          <RecurringSection
            title="Egresos"
            items={expenses}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo fijo">
        <RecurringForm submitting={createMut.isPending} onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar fijo">
        {editing && (
          <RecurringForm
            initial={recurringToFormValues(editing)}
            submitting={updateMut.isPending}
            onSubmit={handleUpdate}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="¿Borrar fijo?"
        message="Los movimientos ya generados en meses anteriores se mantienen."
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

function RecurringSection({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string;
  items: RecurringTransaction[];
  onEdit: (r: RecurringTransaction) => void;
  onDelete: (r: RecurringTransaction) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((r) => {
          const cat = resolveCategory(r);
          return (
            <li
              key={r._id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
                !r.isActive && 'opacity-60'
              )}
            >
              <CategoryIcon
                name={cat?.icon ?? 'circle-help'}
                color={cat?.color ?? '#64748B'}
                containerSize={40}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {r.description || cat?.name || 'Fijo'}
                </div>
                <div className="text-xs text-slate-500">
                  {cat?.name} · día {r.dayOfMonth}
                  {!r.isActive && ' · pausado'}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'font-semibold whitespace-nowrap',
                    r.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {r.type === 'expense' ? '-' : '+'}
                  {formatMoney(r.amount, r.currency)}
                </div>
                <div className="flex justify-end gap-1 mt-1">
                  <button
                    onClick={() => onEdit(r)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    aria-label="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(r)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                    aria-label="Borrar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
