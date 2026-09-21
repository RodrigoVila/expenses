import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Paleta base (coincide con los colores del seed). */
export const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#EC4899', '#F43F5E', '#64748B', '#0F172A',
] as const;

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {COLOR_OPTIONS.map((hex) => {
        const active = value.toLowerCase() === hex.toLowerCase();
        return (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={cn(
              'aspect-square rounded-full flex items-center justify-center transition',
              active && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-900 dark:ring-white'
            )}
            style={{ background: hex }}
            aria-label={`Color ${hex}`}
          >
            {active && <Check size={16} className="text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}
