import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FABProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/** Floating Action Button — arriba de la BottomNav, esquina inferior derecha. */
export function FAB({ onClick, label = 'Agregar', className }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed z-30 right-4 bottom-20 rounded-full shadow-xl',
        'w-14 h-14 flex items-center justify-center',
        'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 transition',
        // Ajuste para tener espacio sobre la nav en safe-area de iOS
        'mb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <Plus size={26} />
    </button>
  );
}
