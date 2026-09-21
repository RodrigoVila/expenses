/**
 * Tipos compartidos con el backend.
 * Espejamos las shapes de mongoose (con id como string en vez de ObjectId).
 */

export type CategoryType = 'expense' | 'income' | 'both';
export type TransactionType = 'expense' | 'income';
export type Currency = 'ARS' | 'USD';

export interface User {
  _id: string;
  email: string;
  name: string;
  picture: string | null;
  isAdmin: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  created: boolean;
}

export interface HouseholdMember {
  _id: string;
  email: string;
  name: string;
  picture: string | null;
}

export interface Household {
  _id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  members: HouseholdMember[];
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'household-invite';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  payload: {
    inviteId?: string;
    householdId?: string;
    householdName?: string;
    invitedByName?: string;
    invitedByEmail?: string;
  };
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  monthlyBudget: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgressItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export interface Transaction {
  _id: string;
  amount: number;
  type: TransactionType;
  categoryId: Category | string;
  description: string;
  date: string;
  currency: Currency;
  arsAmount: number;
  exchangeRate: number | null;
  rateSource: string | null;
  recurringId: string | null;
  /** Si está seteado pertenece a un hogar; sino es personal. */
  householdId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  _id: string;
  amount: number;
  type: TransactionType;
  categoryId: Category | string;
  description: string;
  dayOfMonth: number;
  currency: Currency;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  householdId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface YearlyMonth {
  month: number;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  currency: Currency;
}

export interface MonthSummary {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  currency: Currency;
  count: number;
}

export interface CategoryDelta {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
}

export interface SummaryComparison {
  current: MonthSummary;
  previous: MonthSummary;
  categoryDeltas: CategoryDelta[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
}

export function resolveCategory(
  ref: Category | string,
  categories: Category[]
): Category | undefined {
  if (typeof ref === 'string') {
    return categories.find((c) => c._id === ref);
  }
  return ref;
}
