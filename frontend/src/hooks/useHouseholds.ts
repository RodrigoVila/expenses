import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Household } from '@/lib/types';

function toastError(err: unknown, fallback: string) {
  const msg = err instanceof ApiError ? err.message : fallback;
  toast.error(msg);
}

export function useHouseholds() {
  return useQuery({
    queryKey: qk.households.list,
    queryFn: ({ signal }) => api.get<Household[]>('/households', undefined, signal),
    staleTime: 60_000,
  });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Household>('/households', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Hogar creado');
    },
    onError: (err) => toastError(err, 'No se pudo crear el hogar'),
  });
}

export function useUpdateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch<Household>(`/households/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Hogar actualizado');
    },
    onError: (err) => toastError(err, 'No se pudo actualizar el hogar'),
  });
}

export function useDeleteHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/households/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Hogar borrado');
    },
    onError: (err) => toastError(err, 'No se pudo borrar el hogar'),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      api.post<{ inviteId: string }>(`/households/${id}/invite`, { email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Invitación enviada');
    },
    onError: (err) => toastError(err, 'No se pudo enviar la invitación'),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      api.delete<void>(`/households/${id}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Miembro removido');
    },
    onError: (err) => toastError(err, 'No se pudo remover al miembro'),
  });
}

export function useLeaveHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/households/${id}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.households.all });
      toast.success('Saliste del hogar');
    },
    onError: (err) => toastError(err, 'No se pudo salir del hogar'),
  });
}
