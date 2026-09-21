import { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Chip con avatar y menú desplegable con logout. Se coloca arriba de todas
 * las pantallas autenticadas (en Layout).
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Menú de usuario"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-40 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-0.5">
              <UserIcon size={14} className="text-slate-400" />
              <div className="text-sm font-medium truncate">{user.name}</div>
            </div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
