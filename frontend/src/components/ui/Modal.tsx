import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** En mobile aparece como bottom sheet, en desktop como modal centrado */
  sheet?: boolean;
}

/**
 * Modal / bottom-sheet accesible.
 * Cierra con Esc, click en backdrop, o botón X.
 * Bloquea el scroll del body cuando está abierto.
 */
export function Modal({ open, onClose, title, children, sheet = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      {/* content */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-white dark:bg-slate-900 shadow-xl',
          'max-h-[90svh] overflow-y-auto',
          sheet
            ? 'rounded-t-2xl sm:rounded-2xl sm:max-w-md pb-[env(safe-area-inset-bottom)]'
            : 'rounded-2xl max-w-md'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-inherit z-10">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
