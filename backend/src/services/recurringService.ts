import { RecurringTransaction, type IRecurringTransaction } from '../models/RecurringTransaction';
import { Category } from '../models/Category';
import { HttpError } from '../middleware/errorHandler';
import type { TransactionType, Currency } from '../models/Transaction';

export interface CreateRecurringInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  dayOfMonth: number;
  currency?: Currency;
  startDate: Date;
  endDate?: Date | null;
  isActive?: boolean;
}

export type UpdateRecurringInput = Partial<CreateRecurringInput>;

async function assertCategoryExists(userId: string, categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId, userId });
  if (!exists) throw new HttpError(400, 'categoryId no existe');
}

export const recurringService = {
  async list(userId: string, activeOnly = false): Promise<IRecurringTransaction[]> {
    const filter: Record<string, unknown> = { userId };
    if (activeOnly) filter.isActive = true;
    return RecurringTransaction.find(filter).sort({ dayOfMonth: 1 }).populate('categoryId');
  },

  async getById(userId: string, id: string): Promise<IRecurringTransaction> {
    const item = await RecurringTransaction.findOne({ _id: id, userId }).populate('categoryId');
    if (!item) throw new HttpError(404, 'Recurrente no encontrado');
    return item;
  },

  async create(userId: string, input: CreateRecurringInput): Promise<IRecurringTransaction> {
    await assertCategoryExists(userId, input.categoryId);
    return RecurringTransaction.create({
      ...input,
      userId,
      currency: input.currency ?? 'ARS',
      endDate: input.endDate ?? null,
      isActive: input.isActive ?? true,
    });
  },

  async update(userId: string, id: string, input: UpdateRecurringInput): Promise<IRecurringTransaction> {
    if (input.categoryId) await assertCategoryExists(userId, input.categoryId);
    const item = await RecurringTransaction.findOneAndUpdate({ _id: id, userId }, input, {
      new: true,
      runValidators: true,
    });
    if (!item) throw new HttpError(404, 'Recurrente no encontrado');
    return item;
  },

  async remove(userId: string, id: string): Promise<void> {
    const result = await RecurringTransaction.findOneAndDelete({ _id: id, userId });
    if (!result) throw new HttpError(404, 'Recurrente no encontrado');
  },
};
