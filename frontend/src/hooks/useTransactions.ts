import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type QueryParams } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
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
};

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  date: string; // ISO
  currency?: Currency;
}

export function useTransactions(filters: TransactionListFilters = {}) {
  return useQuery({
    queryKey: qk.transactions.list(filters),
    queryFn: ({ signal }) =>
      api.get<Transaction[]>('/transactions', filters as QueryParams, signal),
    staleTime: 30_000,
  });
}

export function useMonthSummary(year: number, month: number) {
  return useQuery({
    queryKey: qk.transactions.summary(year, month),
    queryFn: ({ signal }) =>
      api.get<MonthSummary[]>('/transactions/summary', { year, month }, signal),
    staleTime: 30_000,
  });
}

export function useCategoryBreakdown(
  year: number,
  month: number,
  type: TransactionType = 'expense',
  currency: Currency = 'ARS'
) {
  return useQuery({
    queryKey: qk.transactions.byCategory(year, month, type, currency),
    queryFn: ({ signal }) =>
      api.get<CategoryBreakdown[]>(
        '/transactions/by-category',
        { year, month, type, currency },
        signal
      ),
    staleTime: 30_000,
  });
}

export function useSummaryComparison(
  year: number,
  month: number,
  currency: Currency = 'ARS'
) {
  return useQuery({
    queryKey: qk.transactions.comparison(year, month, currency),
    queryFn: ({ signal }) =>
      api.get<SummaryComparison>(
        '/transactions/summary-comparison',
        { year, month, currency },
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

export function useYearlySummary(year: number, currency: Currency = 'ARS') {
  return useQuery({
    queryKey: qk.transactions.yearly(year, currency),
    queryFn: ({ signal }) =>
      api.get<YearlyMonth[]>('/transactions/yearly-summary', { year, currency }, signal),
    staleTime: 60_000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      api.post<Transaction>('/transactions', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.transactions.all }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTransactionInput> }) =>
      api.patch<Transaction>(`/transactions/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.transactions.all }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.transactions.all }),
  });
}
