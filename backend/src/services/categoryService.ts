import { Category, type ICategory, type CategoryType } from '../models/Category';
import { Transaction } from '../models/Transaction';
import { HttpError } from '../middleware/errorHandler';
import { monthRange } from '../utils/dateRange';
import type { Currency } from '../models/Transaction';
import { Types } from 'mongoose';

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

export const categoryService = {
  async list(userId: string, includeArchived = false): Promise<ICategory[]> {
    const filter: Record<string, unknown> = { userId };
    if (!includeArchived) filter.isArchived = false;
    return Category.find(filter).sort({ isDefault: -1, name: 1 });
  },

  async getById(userId: string, id: string): Promise<ICategory> {
    const category = await Category.findOne({ _id: id, userId });
    if (!category) throw new HttpError(404, 'Categoría no encontrada');
    return category;
  },

  async create(userId: string, input: CreateCategoryInput): Promise<ICategory> {
    return Category.create({ ...input, userId });
  },

  async update(userId: string, id: string, input: UpdateCategoryInput): Promise<ICategory> {
    const category = await Category.findOneAndUpdate({ _id: id, userId }, input, {
      new: true,
      runValidators: true,
    });
    if (!category) throw new HttpError(404, 'Categoría no encontrada');
    return category;
  },

  async archive(userId: string, id: string, isAdmin: boolean): Promise<ICategory> {
    const category = await Category.findOne({ _id: id, userId });
    if (!category) throw new HttpError(404, 'Categoría no encontrada');
    if (category.isDefault && !isAdmin) {
      throw new HttpError(
        403,
        'Solo el admin puede archivar categorías predefinidas'
      );
    }
    category.isArchived = true;
    await category.save();
    return category;
  },

  async getBudgetProgress(
    userId: string,
    year: number,
    month: number,
    currency: Currency = 'ARS'
  ): Promise<BudgetProgressItem[]> {
    const { start, end } = monthRange(year, month);

    const categoriesWithBudget = await Category.find({
      userId,
      monthlyBudget: { $gt: 0 },
      isArchived: false,
    });

    if (categoriesWithBudget.length === 0) return [];

    const catIds = categoriesWithBudget.map((c) => c._id);

    const spentRows = await Transaction.aggregate<{
      _id: Types.ObjectId;
      total: number;
    }>([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: start, $lt: end },
          type: 'expense',
          currency,
          categoryId: { $in: catIds },
        },
      },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    ]);

    const spentMap = new Map<string, number>();
    for (const r of spentRows) spentMap.set(r._id.toString(), r.total);

    return categoriesWithBudget
      .map<BudgetProgressItem>((c) => {
        const spent = spentMap.get(c._id.toString()) ?? 0;
        const percentage = c.monthlyBudget > 0 ? (spent / c.monthlyBudget) * 100 : 0;
        const status: BudgetProgressItem['status'] =
          percentage >= 100 ? 'exceeded' : percentage >= 70 ? 'warning' : 'ok';
        return {
          categoryId: c._id.toString(),
          categoryName: c.name,
          categoryIcon: c.icon,
          categoryColor: c.color,
          budget: c.monthlyBudget,
          spent,
          remaining: c.monthlyBudget - spent,
          percentage,
          status,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  },
};
