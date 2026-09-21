import { RecurringTransaction, type IRecurringTransaction } from '../models/RecurringTransaction';
import { Category } from '../models/Category';
import { HttpError } from '../middleware/errorHandler';
import { scopeFilter } from '../utils/scope';
import { decryptField, decryptNumber, decryptOptNumber, encryptField, encryptNumber } from '../utils/crypto';
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
  householdId?: string | null;
}

export type UpdateRecurringInput = Partial<Omit<CreateRecurringInput, 'householdId'>>;

async function assertCategoryExists(userId: string, categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId, userId });
  if (!exists) throw new HttpError(400, 'categoryId no existe');
}

/** Desencripta amount y description; y monthlyBudget en categoryId si viene populado. */
function toApi(doc: Record<string, unknown>): IRecurringTransaction {
  const cat = doc.categoryId as Record<string, unknown> | undefined;
  if (cat && typeof cat === 'object' && 'monthlyBudget' in cat) {
    (cat as Record<string, unknown>).monthlyBudget =
      decryptOptNumber(cat.monthlyBudget) ?? 0;
  }
  return {
    ...doc,
    amount: decryptNumber(doc.amount),
    description: decryptField(doc.description),
  } as unknown as IRecurringTransaction;
}

export const recurringService = {
  async list(
    userId: string,
    activeOnly = false,
    householdId?: string | null
  ): Promise<IRecurringTransaction[]> {
    const filter: Record<string, unknown> = scopeFilter(userId, householdId);
    if (activeOnly) filter.isActive = true;
    const docs = await RecurringTransaction.find(filter)
      .sort({ dayOfMonth: 1 })
      .populate('categoryId')
      .lean();
    return docs.map((d) => toApi(d as Record<string, unknown>));
  },

  async getById(
    userId: string,
    id: string,
    householdId?: string | null
  ): Promise<IRecurringTransaction> {
    const doc = await RecurringTransaction.findOne({
      _id: id,
      ...scopeFilter(userId, householdId),
    })
      .populate('categoryId')
      .lean();
    if (!doc) throw new HttpError(404, 'Recurrente no encontrado');
    return toApi(doc as Record<string, unknown>);
  },

  async create(userId: string, input: CreateRecurringInput): Promise<IRecurringTransaction> {
    await assertCategoryExists(userId, input.categoryId);
    const payload = {
      userId,
      householdId: input.householdId ?? null,
      type: input.type,
      categoryId: input.categoryId,
      dayOfMonth: input.dayOfMonth,
      currency: input.currency ?? 'ARS',
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      isActive: input.isActive ?? true,
      amount: encryptNumber(input.amount),
      description: encryptField(input.description ?? ''),
    };
    const doc = await RecurringTransaction.create(payload);
    return toApi(doc.toObject());
  },

  async update(
    userId: string,
    id: string,
    input: UpdateRecurringInput,
    householdId?: string | null
  ): Promise<IRecurringTransaction> {
    if (input.categoryId) await assertCategoryExists(userId, input.categoryId);
    const doc = await RecurringTransaction.findOne({
      _id: id,
      ...scopeFilter(userId, householdId),
    });
    if (!doc) throw new HttpError(404, 'Recurrente no encontrado');
    if (input.type !== undefined) doc.type = input.type;
    if (input.categoryId !== undefined) (doc.categoryId as unknown) = input.categoryId;
    if (input.dayOfMonth !== undefined) doc.dayOfMonth = input.dayOfMonth;
    if (input.currency !== undefined) doc.currency = input.currency;
    if (input.startDate !== undefined) doc.startDate = input.startDate;
    if (input.endDate !== undefined) doc.endDate = input.endDate;
    if (input.isActive !== undefined) doc.isActive = input.isActive;
    if (input.amount !== undefined) doc.amount = encryptNumber(input.amount);
    if (input.description !== undefined) doc.description = encryptField(input.description);
    await doc.save();
    return toApi(doc.toObject());
  },

  async remove(userId: string, id: string, householdId?: string | null): Promise<void> {
    const result = await RecurringTransaction.findOneAndDelete({
      _id: id,
      ...scopeFilter(userId, householdId),
    });
    if (!result) throw new HttpError(404, 'Recurrente no encontrado');
  },
};
