import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InfoTooltipProps {
  text: string;
  className?: string;
  maxWidth?: number;
}

/**
 * Ícono ⓘ con bubble.
 * - Renderiza el bubble en un portal (document.body) para que no lo corte
 *   el overflow del contenedor (ej: modales scrolleables).
 * - Posición: intenta ir arriba del ícono; si no entra, cae abajo.
 * - Desktop hover / mobile tap.
 */
export function InfoTooltip({ text, className, maxWidth = 240 }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'top',
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 8;
    const tooltipHeight = 60; // aprox
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' =
      spaceAbove < tooltipHeight + margin ? 'bottom' : 'top';

    // Centrar horizontalmente pero clampear a los bordes del viewport
    const centerX = rect.left + rect.width / 2;
    const halfW = maxWidth / 2;
    const minLeft = margin + halfW;
    const maxLeft = window.innerWidth - margin - halfW;
    const left = Math.min(Math.max(centerX, minLeft), maxLeft);

    const top =
      placement === 'top'
        ? rect.top - margin
        : rect.bottom + margin;

    setPos({ top, left, placement });
  }, [open, maxWidth]);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Más información"
        className={cn(
          'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition inline-flex',
          className
        )}
      >
        <Info size={14} />
      </button>

      {open &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: maxWidth,
              transform:
                pos.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
            }}
            className={cn(
              'z-[100] pointer-events-none',
              'rounded-lg px-3 py-2 text-xs shadow-lg',
              'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            )}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
