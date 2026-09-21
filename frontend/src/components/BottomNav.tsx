import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, BarChart3, Tag, Repeat, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/movimientos', label: 'Movs', icon: List },
  { to: '/anual', label: 'Anual', icon: BarChart3 },
  { to: '/hogar', label: 'Hogar', icon: Home },
  { to: '/categorias', label: 'Cats', icon: Tag },
  { to: '/fijos', label: 'Fijos', icon: Repeat },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur
                 border-slate-200
                 dark:bg-slate-950/95 dark:border-slate-800
                 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto max-w-md grid grid-cols-6">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs',
                  'transition-colors',
                  isActive
                    ? 'text-brand-600 dark:text-brand-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                )
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
