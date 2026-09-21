import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/lib/format';

interface MonthPickerProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthPicker({ year, month, onPrev, onNext }: MonthPickerProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={onPrev}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="text-lg font-semibold capitalize">
        {formatMonthYear(year, month)}
      </div>
      <button
        onClick={onNext}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
