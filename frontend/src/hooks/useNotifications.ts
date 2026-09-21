import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Notification } from '@/lib/types';

function toastError(err: unknown, fallback: string) {
  const msg = err instanceof ApiError ? err.message : fallback;
  toast.error(msg);
}

export function useNotifications(onlyUnread = false) {
  return useQuery({
    queryKey: qk.notifications.list(onlyUnread),
    queryFn: ({ signal }) =>
      api.get<Notification[]>('/notifications', { onlyUnread }, signal),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: ({ signal }) =>
      api.get<{ count: number }>('/notifications/unread-count', undefined, signal),
    staleTime: 30_000,
    // Refetch cada 60s así el badge se actualiza sin necesidad de push.
    refetchInterval: 60_000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ count: number }>('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api.post<{ householdId: string }>(`/notifications/invites/${inviteId}/accept`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Te uniste al hogar');
    },
    onError: (err) => toastError(err, 'No se pudo aceptar la invitación'),
  });
}

export function useRejectInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api.post<void>(`/notifications/invites/${inviteId}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
      toast.success('Invitación rechazada');
    },
    onError: (err) => toastError(err, 'No se pudo rechazar la invitación'),
  });
}
