import { Category, type ICategory, type CategoryType } from '../models/Category';
import { Transaction } from '../models/Transaction';
import { HttpError } from '../middleware/errorHandler';
import { monthRange } from '../utils/dateRange';
import {
  encryptOptNumber,
  decryptOptNumber,
  decryptNumber,
} from '../utils/crypto';
import type { Currency } from '../models/Transaction';

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  monthlyBudget?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  type?: CategoryType;
  monthlyBudget?: number;
  isArchived?: boolean;
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

/**
 * Convierte un doc de Mongo (con monthlyBudget encriptado) a la shape ICategory
 * (con monthlyBudget desencriptado).
 */
function toApi(doc: Record<string, unknown>): ICategory {
  return {
    ...doc,
    monthlyBudget: decryptOptNumber(doc.monthlyBudget) ?? 0,
  } as unknown as ICategory;
}

export const categoryService = {
  async list(userId: string, includeArchived = false): Promise<ICategory[]> {
    const filter: Record<string, unknown> = { userId };
    if (!includeArchived) filter.isArchived = false;
    const docs = await Category.find(filter).sort({ isDefault: -1, name: 1 }).lean();
    return docs.map((d) => toApi(d as Record<string, unknown>));
  },

  async getById(userId: string, id: string): Promise<ICategory> {
    const doc = await Category.findOne({ _id: id, userId }).lean();
    if (!doc) throw new HttpError(404, 'Categoría no encontrada');
    return toApi(doc as Record<string, unknown>);
  },

  async create(userId: string, input: CreateCategoryInput): Promise<ICategory> {
    const payload = {
      ...input,
      userId,
      monthlyBudget: encryptOptNumber(input.monthlyBudget ?? 0),
    };
    const doc = await Category.create(payload);
    return toApi(doc.toObject());
  },

  async update(
    userId: string,
    id: string,
    input: UpdateCategoryInput,
    isAdmin: boolean
  ): Promise<ICategory> {
    const doc = await Category.findOne({ _id: id, userId });
    if (!doc) throw new HttpError(404, 'Categoría no encontrada');
    if (doc.isDefault && !isAdmin) {
      throw new HttpError(403, 'Solo el admin puede editar categorías predefinidas');
    }
    if (input.name !== undefined) doc.name = input.name;
    if (input.icon !== undefined) doc.icon = input.icon;
    if (input.color !== undefined) doc.color = input.color;
    if (input.type !== undefined) doc.type = input.type;
    if (input.isArchived !== undefined) doc.isArchived = input.isArchived;
    if (input.monthlyBudget !== undefined) {
      doc.monthlyBudget = encryptOptNumber(input.monthlyBudget);
    }
    await doc.save();
    return toApi(doc.toObject());
  },

  async archive(userId: string, id: string, isAdmin: boolean): Promise<ICategory> {
    return this.update(userId, id, { isArchived: true }, isAdmin);
  },

  /**
   * Progreso de presupuesto para el mes dado. Refactoreado a in-memory
   * porque los amounts están encriptados y no se puede hacer $sum.
   */
  async getBudgetProgress(
    userId: string,
    year: number,
    month: number,
    currency: Currency = 'ARS'
  ): Promise<BudgetProgressItem[]> {
    void currency; // presupuestos siempre en ARS
    const { start, end } = monthRange(year, month);

    const cats = await Category.find({
      userId,
      isArchived: false,
    }).lean();

    const catsWithBudget = cats
      .map((c) => ({
        raw: c,
        budget: decryptOptNumber((c as Record<string, unknown>).monthlyBudget) ?? 0,
      }))
      .filter((c) => c.budget > 0);

    if (catsWithBudget.length === 0) return [];

    const catIds = catsWithBudget.map((c) => c.raw._id);
    const txs = await Transaction.find({
      userId,
      date: { $gte: start, $lt: end },
      type: 'expense',
      categoryId: { $in: catIds },
    })
      .select('categoryId arsAmount')
      .lean();

    const spentByCat = new Map<string, number>();
    for (const tx of txs) {
      const catId = String((tx as Record<string, unknown>).categoryId);
      const ars = decryptNumber((tx as Record<string, unknown>).arsAmount);
      spentByCat.set(catId, (spentByCat.get(catId) ?? 0) + ars);
    }

    return catsWithBudget
      .map<BudgetProgressItem>((c) => {
        const spent = spentByCat.get(c.raw._id.toString()) ?? 0;
        const percentage = (spent / c.budget) * 100;
        const status: BudgetProgressItem['status'] =
          percentage >= 100 ? 'exceeded' : percentage >= 70 ? 'warning' : 'ok';
        return {
          categoryId: c.raw._id.toString(),
          categoryName: c.raw.name,
          categoryIcon: c.raw.icon,
          categoryColor: c.raw.color,
          budget: c.budget,
          spent,
          remaining: c.budget - spent,
          percentage,
          status,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  },
};
