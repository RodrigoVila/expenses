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
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  CategoryForm,
  categoryToFormValues,
  type CategoryFormValues,
} from '@/components/forms/CategoryForm';
import { cn } from '@/lib/cn';
import type { Category } from '@/lib/types';

type Tab = 'mine' | 'predefined';

export function Categorias() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const { data: categories = [], isLoading } = useCategories();
  const [tab, setTab] = useState<Tab>('mine');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [archiving, setArchiving] = useState<Category | null>(null);

  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const archiveMut = useArchiveCategory();

  const visible = categories.filter((c) =>
    tab === 'mine' ? !c.isDefault : c.isDefault
  );
  const expense = visible.filter((c) => c.type === 'expense' || c.type === 'both');
  const income = visible.filter((c) => c.type === 'income' || c.type === 'both');

  const handleCreate = async (values: CategoryFormValues) => {
    await createMut.mutateAsync(values);
    setCreating(false);
  };

  const handleUpdate = async (values: CategoryFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing._id, input: values });
    setEditing(null);
  };

  // No-admin en tab "predefinidas": todo read-only.
  // Admin: puede todo en ambas tabs.
  // No-admin en tab "mías": puede todo.
  const canModify = tab === 'mine' || isAdmin;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        {tab === 'mine' && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Nueva
          </Button>
        )}
      </div>

      <TabSwitcher tab={tab} onChange={setTab} />

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {!isLoading && visible.length === 0 && tab === 'mine' && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
          Todavía no creaste ninguna categoría propia. Tocá <b>Nueva</b> para empezar.
        </div>
      )}

      <CategorySection
        title="Gastos"
        items={expense}
        canModify={canModify}
        onEdit={setEditing}
        onArchive={setArchiving}
      />
      <CategorySection
        title="Ingresos"
        items={income}
        canModify={canModify}
        onEdit={setEditing}
        onArchive={setArchiving}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva categoría">
        <CategoryForm submitting={createMut.isPending} onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar categoría">
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

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
      <TabButton active={tab === 'mine'} onClick={() => onChange('mine')}>
        Mías
      </TabButton>
      <TabButton active={tab === 'predefined'} onClick={() => onChange('predefined')}>
        Predefinidas
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'py-2 rounded-lg text-sm font-medium transition',
        active
          ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
      )}
    >
      {children}
    </button>
  );
}

function CategorySection({
  title,
  items,
  canModify,
  onEdit,
  onArchive,
}: {
  title: string;
  items: Category[];
  canModify: boolean;
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
        {items.map((c) => (
          <li
            key={c._id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <CategoryIcon name={c.icon} color={c.color} containerSize={36} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.name}</div>
            </div>
            {canModify ? (
              <>
                <button
                  onClick={() => onEdit(c)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onArchive(c)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                  aria-label="Archivar"
                >
                  <Archive size={16} />
                </button>
              </>
            ) : (
              <span
                className="p-2 text-slate-300 dark:text-slate-600 flex items-center"
                title="Las categorías predefinidas son solo de consulta"
              >
                <Lock size={16} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
