import { useState } from 'react';
import { CalendarPlus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useGenerateFromRecurring, useCopyMonth } from '@/hooks/useRecurring';
import { formatMonthYear } from '@/lib/format';
// setFeedback ya no se usa: los toasts de sonner los cubre useGenerateFromRecurring/useCopyMonth

interface MonthActionsProps {
  year: number;
  month: number;
  /** Muestra el botón "Generar fijos" solo si el usuario tiene fijos configurados. */
  showGenerate?: boolean;
  /** Muestra el botón "Copiar mes anterior" solo si el mes anterior tiene data. */
  showCopy?: boolean;
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function MonthActions({
  year,
  month,
  showGenerate = true,
  showCopy = true,
}: MonthActionsProps) {
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);

  const generateMut = useGenerateFromRecurring();
  const copyMut = useCopyMonth();

  const from = prevMonth(year, month);

  const handleGenerate = async () => {
    await generateMut.mutateAsync({ year, month });
    setConfirmGenerate(false);
  };

  const handleCopy = async () => {
    await copyMut.mutateAsync({ from, to: { year, month } });
    setConfirmCopy(false);
  };

  if (!showGenerate && !showCopy) return null;

  const gridCols = showGenerate && showCopy ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="space-y-2">
      <div className={`grid ${gridCols} gap-2`}>
        {showGenerate && (
          <Button variant="secondary" size="sm" onClick={() => setConfirmGenerate(true)}>
            <CalendarPlus size={14} />
            Generar fijos
          </Button>
        )}
        {showCopy && (
          <Button variant="secondary" size="sm" onClick={() => setConfirmCopy(true)}>
            <Copy size={14} />
            Copiar mes anterior
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmGenerate}
        title="¿Generar movimientos desde fijos?"
        message={`Se van a crear los movimientos activos configurados como fijos en ${formatMonthYear(year, month)}. Si ya existen, no se duplican.`}
        confirmLabel="Generar"
        loading={generateMut.isPending}
        onConfirm={handleGenerate}
        onCancel={() => setConfirmGenerate(false)}
      />

      <ConfirmDialog
        open={confirmCopy}
        title="¿Copiar mes anterior?"
        message={`Se van a copiar todos los movimientos de ${formatMonthYear(from.year, from.month)} a ${formatMonthYear(year, month)}, ajustando la fecha al mismo día del mes.`}
        confirmLabel="Copiar"
        loading={copyMut.isPending}
        onConfirm={handleCopy}
        onCancel={() => setConfirmCopy(false)}
      />
    </div>
  );
}
