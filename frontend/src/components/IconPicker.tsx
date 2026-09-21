import { icons, CircleHelp } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Íconos comunes para categorías (kebab-case matching lucide). */
export const ICON_OPTIONS = [
  // Gastos comunes
  'utensils', 'shopping-cart', 'shopping-bag', 'car', 'bus', 'plane',
  'home', 'plug', 'lightbulb', 'wifi', 'phone', 'droplet',
  'heart-pulse', 'pill', 'stethoscope', 'dumbbell',
  'film', 'music', 'gamepad-2', 'book', 'graduation-cap',
  'shirt', 'gift', 'coffee', 'pizza', 'beer', 'wine',
  'baby', 'dog', 'cat', 'flower',
  // Genéricos + finanzas
  'wallet', 'credit-card', 'banknote', 'piggy-bank', 'trending-up', 'trending-down',
  'briefcase', 'laptop', 'building', 'store',
  'repeat', 'star', 'tag', 'flag', 'bell', 'calendar',
  'circle-help',
] as const;

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color = '#6366F1' }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
      {ICON_OPTIONS.map((name) => {
        const Icon = icons[toPascalCase(name) as keyof typeof icons] ?? CircleHelp;
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={cn(
              'aspect-square rounded-xl flex items-center justify-center transition',
              active
                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            style={{
              background: active ? `${color}22` : undefined,
              color: active ? color : undefined,
              ['--tw-ring-color' as string]: color,
            }}
            aria-label={name}
          >
            <Icon size={22} />
          </button>
        );
      })}
    </div>
  );
}
