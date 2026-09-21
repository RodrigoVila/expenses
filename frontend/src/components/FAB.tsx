import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FabAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Tailwind background classes para el mini-fab, ej "bg-emerald-500" */
  colorClass?: string;
}

interface FABProps {
  actions: FabAction[];
  className?: string;
}

/**
 * FAB con menú desplegable (Speed-Dial pattern).
 * - Un ícono + principal.
 * - Al tocar, se expanden mini-FABs verticalmente hacia arriba, cada uno con label.
 * - Backdrop transparente al toque cierra.
 * - Rota el ícono a X mientras está abierto.
 */
export function FAB({ actions, className }: FABProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <>
      {/* Backdrop suave cuando está abierto */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          'fixed z-30 right-4 bottom-20 flex flex-col items-end gap-3',
          'mb-[env(safe-area-inset-bottom)]',
          className
        )}
      >
        {/* Mini FABs */}
        {open &&
          actions.map((action, i) => (
            <div
              key={action.label}
              className="flex items-center gap-2"
              style={{
                animation: `fabPop 200ms ease-out ${i * 40}ms both`,
              }}
            >
              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800">
                {action.label}
              </span>
              <button
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={cn(
                  'w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition',
                  action.colorClass ?? 'bg-slate-700 hover:bg-slate-800'
                )}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className={cn(
            'w-14 h-14 rounded-full shadow-xl flex items-center justify-center',
            'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 transition-transform'
          )}
        >
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            {open ? <X size={26} /> : <Plus size={26} />}
          </span>
        </button>
      </div>

      <style>{`
        @keyframes fabPop {
          from { opacity: 0; transform: translateY(8px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
    </>
  );
}
