import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { BudgetProgressItem, Category, CategoryType, Currency } from '@/lib/types';

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  monthlyBudget?: number;
}

export function useBudgetProgress(year: number, month: number, currency: Currency = 'ARS') {
  return useQuery({
    queryKey: qk.categories.budgetProgress(year, month, currency),
    queryFn: ({ signal }) =>
      api.get<BudgetProgressItem[]>(
        '/categories/budget-progress',
        { year, month, currency },
        signal
      ),
    staleTime: 30_000,
  });
}

export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: qk.categories.list(includeArchived),
    queryFn: ({ signal }) =>
      api.get<Category[]>('/categories', { includeArchived }, signal),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => api.post<Category>('/categories', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      api.patch<Category>(`/categories/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}
