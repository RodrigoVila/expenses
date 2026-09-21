import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Currency, RecurringTransaction, TransactionType } from '@/lib/types';

function toastError(err: unknown, fallback: string) {
  const msg = err instanceof ApiError ? err.message : fallback;
  toast.error(msg);
}

export interface RecurringInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  dayOfMonth: number;
  currency?: Currency;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
  householdId?: string | null;
}

export function useRecurring(activeOnly = false, householdId?: string) {
  return useQuery({
    queryKey: [...qk.recurring.list(activeOnly), { householdId }] as const,
    queryFn: ({ signal }) =>
      api.get<RecurringTransaction[]>('/recurring', { activeOnly, householdId }, signal),
    staleTime: 60_000,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringInput) => api.post<RecurringTransaction>('/recurring', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring.all });
      toast.success('Fijo creado');
    },
    onError: (err) => toastError(err, 'No se pudo crear el fijo'),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RecurringInput> }) =>
      api.patch<RecurringTransaction>(`/recurring/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring.all });
      toast.success('Fijo actualizado');
    },
    onError: (err) => toastError(err, 'No se pudo actualizar el fijo'),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/recurring/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring.all });
      toast.success('Fijo borrado');
    },
    onError: (err) => toastError(err, 'No se pudo borrar el fijo'),
  });
}

// ---- Month bootstrap ----

export interface GenerateResult {
  createdCount: number;
  skippedCount: number;
}

export interface CopyMonthResult {
  createdCount: number;
  sourceCount: number;
}

export function useGenerateFromRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { year: number; month: number; householdId?: string | null }) =>
      api.post<GenerateResult>('/months/generate-from-recurring', args),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.transactions.all });
      if (res.createdCount === 0) {
        toast.info('No había fijos nuevos para generar');
      } else {
        toast.success(`Se generaron ${res.createdCount} movimientos desde tus fijos`);
      }
    },
    onError: (err) => toastError(err, 'No se pudo generar desde fijos'),
  });
}

export function useCopyMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      from: { year: number; month: number };
      to: { year: number; month: number };
      householdId?: string | null;
    }) => api.post<CopyMonthResult>('/months/copy-month', args),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.transactions.all });
      if (res.createdCount === 0) {
        toast.info('No había movimientos para copiar');
      } else {
        toast.success(`Se copiaron ${res.createdCount} movimientos`);
      }
    },
    onError: (err) => toastError(err, 'No se pudo copiar el mes'),
  });
}
