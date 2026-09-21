import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...rest },
  ref
) {
  const selectId = id ?? rest.name;
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full px-3 py-2 rounded-xl border text-base',
          'bg-white dark:bg-slate-900',
          'border-slate-300 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error && 'border-red-500',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
