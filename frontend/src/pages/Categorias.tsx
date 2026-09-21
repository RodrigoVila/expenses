import { useState } from 'react';
import { Plus, Pencil, Archive, Lock } from 'lucide-react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useArchiveCategory,
} from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  CategoryForm,
  categoryToFormValues,
  type CategoryFormValues,
} from '@/components/forms/CategoryForm';
import type { Category } from '@/lib/types';

export function Categorias() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const { data: categories = [], isLoading } = useCategories();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [archiving, setArchiving] = useState<Category | null>(null);

  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const archiveMut = useArchiveCategory();

  const expense = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const income = categories.filter((c) => c.type === 'income' || c.type === 'both');

  const handleCreate = async (values: CategoryFormValues) => {
    await createMut.mutateAsync(values);
    setCreating(false);
  };

  const handleUpdate = async (values: CategoryFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing._id, input: values });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Nueva
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      <CategorySection
        title="Gastos"
        items={expense}
        isAdmin={isAdmin}
        onEdit={setEditing}
        onArchive={setArchiving}
      />
      <CategorySection
        title="Ingresos"
        items={income}
        isAdmin={isAdmin}
        onEdit={setEditing}
        onArchive={setArchiving}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva categoría">
        <CategoryForm submitting={createMut.isPending} onSubmit={handleCreate} />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar categoría"
      >
        {editing && (
          <CategoryForm
            initial={categoryToFormValues(editing)}
            submitting={updateMut.isPending}
            onSubmit={handleUpdate}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!archiving}
        title="¿Archivar categoría?"
        message="No se va a poder usar en nuevos movimientos, pero los movimientos existentes se mantienen."
        danger
        confirmLabel="Archivar"
        loading={archiveMut.isPending}
        onConfirm={async () => {
          if (archiving) {
            await archiveMut.mutateAsync(archiving._id);
            setArchiving(null);
          }
        }}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}

function CategorySection({
  title,
  items,
  isAdmin,
  onEdit,
  onArchive,
}: {
  title: string;
  items: Category[];
  isAdmin: boolean;
  onEdit: (c: Category) => void;
  onArchive: (c: Category) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((c) => {
          const canArchive = !c.isDefault || isAdmin;
          return (
            <li
              key={c._id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <CategoryIcon name={c.icon} color={c.color} containerSize={36} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                {c.isDefault && <div className="text-xs text-slate-500">Predefinida</div>}
              </div>
              <button
                onClick={() => onEdit(c)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              {canArchive ? (
                <button
                  onClick={() => onArchive(c)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                  aria-label="Archivar"
                >
                  <Archive size={16} />
                </button>
              ) : (
                <span className="p-2 text-slate-300 dark:text-slate-600 flex items-center">
                  <Lock size={16} />
                  <InfoTooltip text="Las categorías predefinidas no se pueden archivar. Podés editar su ícono, color y presupuesto." />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
