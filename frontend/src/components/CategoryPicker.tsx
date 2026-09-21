import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useRecentCategories } from '@/hooks/useTransactions';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '@/lib/cn';
import type { Category, TransactionType } from '@/lib/types';

interface CategoryPickerProps {
  value: string;
  onChange: (categoryId: string) => void;
  filterByType?: TransactionType;
  label?: string;
  /** Si true, muestra sección "Recientes" al top */
  showRecent?: boolean;
}

/**
 * Dropdown de categorías con búsqueda + íconos.
 * - Trigger: botón mostrando la categoría seleccionada (icon + nombre).
 * - Panel: lista scrolleable con "Recientes" al top y "Todas" abajo.
 * - Búsqueda simple por nombre.
 */
export function CategoryPicker({
  value,
  onChange,
  filterByType,
  label = 'Categoría',
  showRecent = true,
}: CategoryPickerProps) {
  const { data: categories = [], isLoading, error } = useCategories();
  const { data: recentIds = [] } = useRecentCategories(filterByType, 5);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Focus a la búsqueda al abrir
  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 30);
  }, [open]);

  const filtered = useMemo<Category[]>(() => {
    return categories.filter((c) => {
      if (c.isArchived) return false;
      if (filterByType && c.type !== filterByType && c.type !== 'both') return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [categories, filterByType, search]);

  const { recent, rest } = useMemo(() => {
    if (!showRecent || recentIds.length === 0 || search) {
      return { recent: [] as Category[], rest: filtered };
    }
    const map = new Map(filtered.map((c) => [c._id, c]));
    const recentArr = recentIds.map((id) => map.get(id)).filter((c): c is Category => !!c);
    const recentIdsSet = new Set(recentArr.map((c) => c._id));
    const restArr = filtered.filter((c) => !recentIdsSet.has(c._id));
    return { recent: recentArr, rest: restArr };
  }, [filtered, recentIds, showRecent, search]);

  const selected = categories.find((c) => c._id === value) ?? null;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>

      {isLoading ? (
        <div className="text-sm text-slate-500 py-3 text-center border border-slate-200 dark:border-slate-800 rounded-xl">
          Cargando categorías...
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 py-3 px-3 rounded-xl bg-red-50 dark:bg-red-950">
          Error cargando categorías. ¿El backend está corriendo?
        </div>
      ) : categories.filter((c) => !c.isArchived).length === 0 ? (
        <div className="text-sm text-slate-600 dark:text-slate-300 py-3 px-3 rounded-xl bg-slate-100 dark:bg-slate-800">
          No hay categorías. Creá una desde la pantalla Categorías.
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left',
              'bg-white dark:bg-slate-900',
              'border-slate-300 dark:border-slate-700',
              'hover:bg-slate-50 dark:hover:bg-slate-800 transition',
              open && 'ring-2 ring-brand-500'
            )}
          >
            {selected ? (
              <>
                <CategoryIcon name={selected.icon} color={selected.color} containerSize={28} />
                <span className="flex-1 truncate text-sm font-medium">{selected.name}</span>
              </>
            ) : (
              <span className="flex-1 text-sm text-slate-400">Elegí una categoría</span>
            )}
            <ChevronDown
              size={18}
              className={cn(
                'text-slate-400 transition-transform shrink-0',
                open && 'rotate-180'
              )}
            />
          </button>

          {/* Panel */}
          {open && (
            <div
              className={cn(
                'absolute z-30 mt-1 w-full rounded-xl shadow-lg overflow-hidden',
                'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              )}
            >
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {recent.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-3 pt-2 pb-1">
                      Recientes
                    </div>
                    {recent.map((c) => (
                      <CategoryOption
                        key={c._id}
                        category={c}
                        active={value === c._id}
                        onClick={() => {
                          onChange(c._id);
                          setOpen(false);
                          setSearch('');
                        }}
                      />
                    ))}
                  </div>
                )}
                {rest.length > 0 && (
                  <div>
                    {recent.length > 0 && (
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-3 pt-2 pb-1">
                        Todas
                      </div>
                    )}
                    {rest.map((c) => (
                      <CategoryOption
                        key={c._id}
                        category={c}
                        active={value === c._id}
                        onClick={() => {
                          onChange(c._id);
                          setOpen(false);
                          setSearch('');
                        }}
                      />
                    ))}
                  </div>
                )}
                {filtered.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Sin resultados
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryOption({
  category,
  active,
  onClick,
}: {
  category: Category;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition',
        active && 'bg-brand-500/5'
      )}
    >
      <CategoryIcon name={category.icon} color={category.color} containerSize={28} />
      <span className="flex-1 text-sm truncate">{category.name}</span>
      {active && <Check size={16} className="text-brand-600 shrink-0" />}
    </button>
  );
}
