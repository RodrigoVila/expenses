/**
 * Query keys centralizadas para React Query.
 * Ayuda a invalidar cache sin errores de tipeo.
 */

export const qk = {
  categories: {
    all: ['categories'] as const,
    list: (includeArchived = false) => ['categories', { includeArchived }] as const,
    budgetProgress: (year: number, month: number, currency: string) =>
      ['categories', 'budget-progress', { year, month, currency }] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: Record<string, unknown>) => ['transactions', 'list', filters] as const,
    summary: (year: number, month: number) =>
      ['transactions', 'summary', { year, month }] as const,
    comparison: (year: number, month: number, currency: string) =>
      ['transactions', 'comparison', { year, month, currency }] as const,
    byCategory: (year: number, month: number, type: string, currency: string) =>
      ['transactions', 'by-category', { year, month, type, currency }] as const,
    yearly: (year: number, currency: string) =>
      ['transactions', 'yearly', { year, currency }] as const,
    recentCategories: (type?: string) =>
      ['transactions', 'recent-categories', { type }] as const,
    recentDescriptions: (type?: string) =>
      ['transactions', 'recent-descriptions', { type }] as const,
  },
  recurring: {
    all: ['recurring'] as const,
    list: (activeOnly = false) => ['recurring', { activeOnly }] as const,
  },
} as const;
