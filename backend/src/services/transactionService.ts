import { Transaction, type ITransaction, type TransactionType, type Currency } from '../models/Transaction';
import { Category } from '../models/Category';
import { HttpError } from '../middleware/errorHandler';
import { monthRange } from '../utils/dateRange';
import { Types } from 'mongoose';

export interface ListFilters {
  year?: number;
  month?: number;
  type?: TransactionType;
  categoryId?: string;
  currency?: Currency;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  date: Date;
  currency?: Currency;
  recurringId?: string | null;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  description?: string;
  date?: Date;
  currency?: Currency;
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

export interface YearlyMonth {
  month: number;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  currency: Currency;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
}

async function assertCategoryExists(userId: string, categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId, userId });
  if (!exists) throw new HttpError(400, 'categoryId no existe');
}

export const transactionService = {
  async list(userId: string, filters: ListFilters): Promise<ITransaction[]> {
    const query: Record<string, unknown> = { userId };
    if (filters.year && filters.month) {
      const { start, end } = monthRange(filters.year, filters.month);
      query.date = { $gte: start, $lt: end };
    }
    if (filters.type) query.type = filters.type;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.currency) query.currency = filters.currency;

    return Transaction.find(query).sort({ date: -1, createdAt: -1 }).populate('categoryId');
  },

  async getById(userId: string, id: string): Promise<ITransaction> {
    const tx = await Transaction.findOne({ _id: id, userId }).populate('categoryId');
    if (!tx) throw new HttpError(404, 'Movimiento no encontrado');
    return tx;
  },

  async create(userId: string, input: CreateTransactionInput): Promise<ITransaction> {
    await assertCategoryExists(userId, input.categoryId);
    return Transaction.create({
      ...input,
      userId,
      recurringId: input.recurringId ?? null,
      currency: input.currency ?? 'ARS',
    });
  },

  async update(userId: string, id: string, input: UpdateTransactionInput): Promise<ITransaction> {
    if (input.categoryId) await assertCategoryExists(userId, input.categoryId);
    const tx = await Transaction.findOneAndUpdate({ _id: id, userId }, input, {
      new: true,
      runValidators: true,
    });
    if (!tx) throw new HttpError(404, 'Movimiento no encontrado');
    return tx;
  },

  async remove(userId: string, id: string): Promise<void> {
    const result = await Transaction.findOneAndDelete({ _id: id, userId });
    if (!result) throw new HttpError(404, 'Movimiento no encontrado');
  },

  async exportCSV(userId: string, filters: ListFilters = {}): Promise<string> {
    const query: Record<string, unknown> = { userId };
    if (filters.year && filters.month) {
      const { start, end } = monthRange(filters.year, filters.month);
      query.date = { $gte: start, $lt: end };
    } else if (filters.year) {
      const start = new Date(Date.UTC(filters.year, 0, 1));
      const end = new Date(Date.UTC(filters.year + 1, 0, 1));
      query.date = { $gte: start, $lt: end };
    }
    if (filters.type) query.type = filters.type;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.currency) query.currency = filters.currency;

    const txs = await Transaction.find(query)
      .sort({ date: -1 })
      .populate<{ categoryId: { name: string } }>('categoryId', 'name');

    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows: string[] = [
      ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Moneda', 'Fijo'].join(','),
    ];
    for (const tx of txs) {
      const cat = tx.categoryId as unknown as { name?: string } | string;
      const catName = typeof cat === 'string' ? '' : cat?.name ?? '';
      rows.push(
        [
          tx.date.toISOString().slice(0, 10),
          tx.type === 'expense' ? 'Gasto' : 'Ingreso',
          catName,
          tx.description,
          tx.amount,
          tx.currency,
          tx.recurringId ? 'Sí' : 'No',
        ]
          .map(escape)
          .join(',')
      );
    }
    return rows.join('\n');
  },

  async getRecentCategoryIds(userId: string, type?: TransactionType, limit = 5): Promise<string[]> {
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: { $gte: since },
    };
    if (type) match.type = type;

    const rows = await Transaction.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: match },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    return rows.map((r) => r._id.toString());
  },

  async getRecentDescriptions(userId: string, type?: TransactionType, limit = 20): Promise<string[]> {
    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      description: { $ne: '' },
    };
    if (type) match.type = type;

    const rows = await Transaction.aggregate<{ _id: string; count: number; last: Date }>([
      { $match: match },
      {
        $group: {
          _id: '$description',
          count: { $sum: 1 },
          last: { $max: '$date' },
        },
      },
      { $sort: { count: -1, last: -1 } },
      { $limit: limit },
    ]);
    return rows.map((r) => r._id);
  },

  async getMonthSummary(userId: string, year: number, month: number): Promise<MonthSummary[]> {
    const { start, end } = monthRange(year, month);

    const result = await Transaction.aggregate<{
      _id: { currency: Currency; type: TransactionType };
      total: number;
      count: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { currency: '$currency', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byCurrency = new Map<Currency, MonthSummary>();
    for (const row of result) {
      const currency = row._id.currency;
      const summary = byCurrency.get(currency) ?? {
        totalExpense: 0,
        totalIncome: 0,
        balance: 0,
        currency,
        count: 0,
      };
      if (row._id.type === 'expense') summary.totalExpense += row.total;
      else summary.totalIncome += row.total;
      summary.count += row.count;
      byCurrency.set(currency, summary);
    }

    return Array.from(byCurrency.values()).map((s) => ({
      ...s,
      balance: s.totalIncome - s.totalExpense,
    }));
  },

  async getSummaryComparison(
    userId: string,
    year: number,
    month: number,
    currency: Currency = 'ARS'
  ): Promise<SummaryComparison> {
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };

    const [currentAll, previousAll, currentByCat, previousByCat] = await Promise.all([
      this.getMonthSummary(userId, year, month),
      this.getMonthSummary(userId, prev.y, prev.m),
      this.getCategoryBreakdown(userId, year, month, 'expense', currency),
      this.getCategoryBreakdown(userId, prev.y, prev.m, 'expense', currency),
    ]);

    const emptySummary: MonthSummary = {
      totalExpense: 0,
      totalIncome: 0,
      balance: 0,
      currency,
      count: 0,
    };
    const current = currentAll.find((s) => s.currency === currency) ?? emptySummary;
    const previous = previousAll.find((s) => s.currency === currency) ?? emptySummary;

    const catMap = new Map<string, CategoryDelta>();
    for (const c of currentByCat) {
      catMap.set(c.categoryId, {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        categoryIcon: c.categoryIcon,
        categoryColor: c.categoryColor,
        current: c.total,
        previous: 0,
        delta: 0,
        deltaPct: null,
      });
    }
    for (const p of previousByCat) {
      const existing = catMap.get(p.categoryId);
      if (existing) {
        existing.previous = p.total;
      } else {
        catMap.set(p.categoryId, {
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          categoryIcon: p.categoryIcon,
          categoryColor: p.categoryColor,
          current: 0,
          previous: p.total,
          delta: 0,
          deltaPct: null,
        });
      }
    }
    for (const d of catMap.values()) {
      d.delta = d.current - d.previous;
      d.deltaPct = d.previous === 0 ? null : (d.delta / d.previous) * 100;
    }

    return {
      current,
      previous,
      categoryDeltas: Array.from(catMap.values()).sort((a, b) => b.current - a.current),
    };
  },

  async getYearlySummary(userId: string, year: number, currency: Currency = 'ARS'): Promise<YearlyMonth[]> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await Transaction.aggregate<{
      _id: { month: number; type: TransactionType };
      total: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lt: end }, currency } },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const byMonth = new Map<number, YearlyMonth>();
    for (let m = 1; m <= 12; m++) {
      byMonth.set(m, { month: m, totalExpense: 0, totalIncome: 0, balance: 0, currency });
    }
    for (const row of rows) {
      const entry = byMonth.get(row._id.month)!;
      if (row._id.type === 'expense') entry.totalExpense += row.total;
      else entry.totalIncome += row.total;
    }
    for (const entry of byMonth.values()) {
      entry.balance = entry.totalIncome - entry.totalExpense;
    }
    return Array.from(byMonth.values());
  },

  async getCategoryBreakdown(
    userId: string,
    year: number,
    month: number,
    type: TransactionType = 'expense',
    currency: Currency = 'ARS'
  ): Promise<CategoryBreakdownItem[]> {
    const { start, end } = monthRange(year, month);

    const result = await Transaction.aggregate<{
      _id: Types.ObjectId;
      total: number;
      count: number;
      category: { name: string; icon: string; color: string }[];
    }>([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: start, $lt: end },
          type,
          currency,
        },
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $sort: { total: -1 } },
    ]);

    return result
      .filter((r) => r.category.length > 0)
      .map((r) => ({
        categoryId: r._id.toString(),
        categoryName: r.category[0].name,
        categoryIcon: r.category[0].icon,
        categoryColor: r.category[0].color,
        total: r.total,
        count: r.count,
      }));
  },
};
