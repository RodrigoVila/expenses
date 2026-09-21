import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Currency, RecurringTransaction, TransactionType } from '@/lib/types';

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
}

export function useRecurring(activeOnly = false) {
  return useQuery({
    queryKey: qk.recurring.list(activeOnly),
    queryFn: ({ signal }) =>
      api.get<RecurringTransaction[]>('/recurring', { activeOnly }, signal),
    staleTime: 60_000,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringInput) => api.post<RecurringTransaction>('/recurring', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring.all }),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RecurringInput> }) =>
      api.patch<RecurringTransaction>(`/recurring/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring.all }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/recurring/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recurring.all }),
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
    mutationFn: (args: { year: number; month: number }) =>
      api.post<GenerateResult>('/months/generate-from-recurring', args),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.transactions.all }),
  });
}

export function useCopyMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      from: { year: number; month: number };
      to: { year: number; month: number };
    }) => api.post<CopyMonthResult>('/months/copy-month', args),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.transactions.all }),
  });
}
