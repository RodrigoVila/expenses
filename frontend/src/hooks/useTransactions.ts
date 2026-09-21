import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, type QueryParams } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

function toastError(err: unknown, fallback: string) {
  const msg = err instanceof ApiError ? err.message : fallback;
  toast.error(msg);
}
import type {
  CategoryBreakdown,
  Currency,
  MonthSummary,
  SummaryComparison,
  Transaction,
  TransactionType,
  YearlyMonth,
} from '@/lib/types';

export type TransactionListFilters = {
  year?: number;
  month?: number;
  type?: TransactionType;
  categoryId?: string;
  currency?: Currency;
  householdId?: string;
};

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  date: string; // ISO
  currency?: Currency;
  arsAmount: number;
  exchangeRate?: number | null;
  rateSource?: string | null;
  householdId?: string | null;
}

export function useTransactions(filters: TransactionListFilters = {}) {
  return useQuery({
    queryKey: qk.transactions.list(filters),
    queryFn: ({ signal }) =>
      api.get<Transaction[]>('/transactions', filters as QueryParams, signal),
    staleTime: 30_000,
  });
}

export function useMonthSummary(year: number, month: number, householdId?: string) {
  return useQuery({
    queryKey: [...qk.transactions.summary(year, month), { householdId }] as const,
    queryFn: ({ signal }) =>
      api.get<MonthSummary>('/transactions/summary', { year, month, householdId }, signal),
    staleTime: 30_000,
  });
}

export function useCategoryBreakdown(
  year: number,
  month: number,
  type: TransactionType = 'expense',
  householdId?: string
) {
  return useQuery({
    queryKey: [...qk.transactions.byCategory(year, month, type, 'ARS'), { householdId }] as const,
    queryFn: ({ signal }) =>
      api.get<CategoryBreakdown[]>(
        '/transactions/by-category',
        { year, month, type, householdId },
        signal
      ),
    staleTime: 30_000,
  });
}

export function useSummaryComparison(year: number, month: number, householdId?: string) {
  return useQuery({
    queryKey: [...qk.transactions.comparison(year, month, 'ARS'), { householdId }] as const,
    queryFn: ({ signal }) =>
      api.get<SummaryComparison>(
        '/transactions/summary-comparison',
        { year, month, householdId },
        signal
      ),
    staleTime: 30_000,
  });
}

export function useRecentCategories(type?: TransactionType, limit = 5) {
  return useQuery({
    queryKey: qk.transactions.recentCategories(type),
    queryFn: ({ signal }) =>
      api.get<string[]>('/transactions/recent-categories', { type, limit }, signal),
    staleTime: 60_000,
  });
}

export function useRecentDescriptions(type?: TransactionType) {
  return useQuery({
    queryKey: qk.transactions.recentDescriptions(type),
    queryFn: ({ signal }) =>
      api.get<string[]>('/transactions/recent-descriptions', { type, limit: 30 }, signal),
    staleTime: 60_000,
  });
}

export function useYearlySummary(year: number) {
  return useQuery({
    queryKey: qk.transactions.yearly(year, 'ARS'),
    queryFn: ({ signal }) =>
      api.get<YearlyMonth[]>('/transactions/yearly-summary', { year }, signal),
    staleTime: 60_000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      api.post<Transaction>('/transactions', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions.all });
      qc.invalidateQueries({ queryKey: qk.categories.all });
      toast.success('Movimiento guardado');
    },
    onError: (err) => toastError(err, 'No se pudo guardar el movimiento'),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTransactionInput> }) =>
      api.patch<Transaction>(`/transactions/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions.all });
      qc.invalidateQueries({ queryKey: qk.categories.all });
      toast.success('Movimiento actualizado');
    },
    onError: (err) => toastError(err, 'No se pudo actualizar el movimiento'),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: string | { id: string; householdId?: string }) => {
      const id = typeof arg === 'string' ? arg : arg.id;
      const householdId = typeof arg === 'string' ? undefined : arg.householdId;
      const qs = householdId ? `?householdId=${householdId}` : '';
      return api.delete<void>(`/transactions/${id}${qs}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions.all });
      qc.invalidateQueries({ queryKey: qk.categories.all });
      toast.success('Movimiento borrado');
    },
    onError: (err) => toastError(err, 'No se pudo borrar el movimiento'),
  });
}
