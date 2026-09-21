import { useState, useRef, useEffect } from 'react';
import { Bell, Home, Check, X } from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllRead,
  useAcceptInvite,
  useRejectInvite,
} from '@/hooks/useNotifications';
import { cn } from '@/lib/cn';
import type { Notification } from '@/lib/types';

/**
 * Ícono de campanita en el header. Muestra badge con cantidad no-leídas.
 * Al abrir muestra un panel con las notificaciones (invites a hogar por ahora).
 * Cada invite tiene botones para aceptar / rechazar inline.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unread } = useUnreadCount();
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllRead();
  const acceptInvite = useAcceptInvite();
  const rejectInvite = useRejectInvite();

  const unreadCount = unread?.count ?? 0;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (open && unreadCount > 0) {
      // Al abrir el panel, marcamos como leídas (pero mantenemos los items visibles)
      markAllRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Notificaciones"
      >
        <Bell size={18} className="text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-40 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
            <div className="text-sm font-semibold">Notificaciones</div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No tenés notificaciones
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n._id}
                    n={n}
                    onAccept={(inviteId) => acceptInvite.mutate(inviteId)}
                    onReject={(inviteId) => rejectInvite.mutate(inviteId)}
                    pending={acceptInvite.isPending || rejectInvite.isPending}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  n,
  onAccept,
  onReject,
  pending,
}: {
  n: Notification;
  onAccept: (inviteId: string) => void;
  onReject: (inviteId: string) => void;
  pending: boolean;
}) {
  if (n.type === 'household-invite') {
    const inviteId = n.payload.inviteId;
    const householdName = n.payload.householdName ?? 'Hogar';
    const invitedByName = n.payload.invitedByName ?? 'Alguien';
    return (
      <li className={cn('p-3', !n.readAt && 'bg-brand-500/5')}>
        <div className="flex items-start gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0">
            <Home size={14} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex-1 text-sm">
            <b>{invitedByName}</b> te invitó al hogar <b>{householdName}</b>
          </div>
        </div>
        {inviteId && (
          <div className="flex gap-2 ml-10">
            <button
              onClick={() => onReject(inviteId)}
              disabled={pending}
              className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 disabled:opacity-50"
            >
              <X size={12} />
              Rechazar
            </button>
            <button
              onClick={() => onAccept(inviteId)}
              disabled={pending}
              className="text-xs px-2 py-1 rounded-lg bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1 disabled:opacity-50"
            >
              <Check size={12} />
              Aceptar
            </button>
          </div>
        )}
      </li>
    );
  }
  return null;
}
