import { useState } from 'react';
import { CalendarPlus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useGenerateFromRecurring, useCopyMonth } from '@/hooks/useRecurring';
import { formatMonthYear } from '@/lib/format';

interface MonthActionsProps {
  year: number;
  month: number;
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function MonthActions({ year, month }: MonthActionsProps) {
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const generateMut = useGenerateFromRecurring();
  const copyMut = useCopyMonth();

  const from = prevMonth(year, month);

  const handleGenerate = async () => {
    const res = await generateMut.mutateAsync({ year, month });
    setConfirmGenerate(false);
    setFeedback(
      `Se generaron ${res.createdCount} movimientos desde tus fijos (${res.skippedCount} ya existían).`
    );
  };

  const handleCopy = async () => {
    const res = await copyMut.mutateAsync({ from, to: { year, month } });
    setConfirmCopy(false);
    setFeedback(
      `Se copiaron ${res.createdCount} movimientos desde ${formatMonthYear(from.year, from.month)}.`
    );
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={() => setConfirmGenerate(true)}>
          <CalendarPlus size={14} />
          Generar fijos
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirmCopy(true)}>
          <Copy size={14} />
          Copiar mes anterior
        </Button>
      </div>

      {feedback && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
          {feedback}
        </p>
      )}

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
