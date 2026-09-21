import { icons, CircleHelp, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CategoryIconProps extends Omit<LucideProps, 'ref'> {
  /** Nombre en kebab-case, ej "shopping-cart" */
  name: string;
  color?: string;
  /** Tamaño del círculo contenedor en px */
  containerSize?: number;
  className?: string;
}

/** Convierte "shopping-cart" → "ShoppingCart" (nombres de lucide-react/icons). */
function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/**
 * Renderiza el ícono de lucide-react correspondiente al nombre.
 * Si no existe, cae a HelpCircle.
 */
export function CategoryIcon({
  name,
  color = '#64748B',
  containerSize = 40,
  className,
  ...iconProps
}: CategoryIconProps) {
  const iconKey = toPascalCase(name) as keyof typeof icons;
  const Icon = icons[iconKey] ?? CircleHelp;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0',
        className
      )}
      style={{
        width: containerSize,
        height: containerSize,
        background: `${color}22`, // 13% opacity
        color,
      }}
    >
      <Icon size={containerSize * 0.5} {...iconProps} />
    </div>
  );
}
