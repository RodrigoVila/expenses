import { Transaction, type ITransaction, type TransactionType, type Currency } from '../models/Transaction';
import { Category } from '../models/Category';
import { HttpError } from '../middleware/errorHandler';
import { monthRange } from '../utils/dateRange';
import { scopeFilter } from '../utils/scope';
import {
  decryptField,
  decryptNumber,
  decryptOptNumber,
  encryptField,
  encryptNumber,
  encryptOptNumber,
} from '../utils/crypto';
import { Types } from 'mongoose';

export interface ListFilters {
  year?: number;
  month?: number;
  type?: TransactionType;
  categoryId?: string;
  currency?: Currency;
  /** Si está seteado, filtra por hogar; sino es scope personal. */
  householdId?: string | null;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  date: Date;
  currency?: Currency;
  arsAmount: number;
  exchangeRate?: number | null;
  rateSource?: string | null;
  recurringId?: string | null;
  /** Si viene, el movimiento se asocia al hogar. Sino es personal. */
  householdId?: string | null;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  description?: string;
  date?: Date;
  currency?: Currency;
  arsAmount?: number;
  exchangeRate?: number | null;
  rateSource?: string | null;
}

export interface MonthSummary {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  count: number;
  usdExpense: number;
  usdIncome: number;
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

/**
 * Desencripta un doc raw de Transaction a la shape ITransaction (con números
 * y strings planos). El categoryId puede venir populado (objeto) o como ObjectId.
 */
function toApi(doc: Record<string, unknown>): ITransaction {
  return {
    ...doc,
    amount: decryptNumber(doc.amount),
    description: decryptField(doc.description),
    arsAmount: decryptNumber(doc.arsAmount),
    exchangeRate: decryptOptNumber(doc.exchangeRate),
  } as unknown as ITransaction;
}

/**
 * Para queries que populan categoryId: la categoría viene con monthlyBudget
 * encriptado. Lo desencriptamos para no exponer ciphertext al frontend.
 */
function decryptPopulatedCategory<T extends Record<string, unknown>>(doc: T): T {
  const cat = doc.categoryId as Record<string, unknown> | undefined;
  if (cat && typeof cat === 'object' && 'monthlyBudget' in cat) {
    (cat as Record<string, unknown>).monthlyBudget =
      decryptOptNumber(cat.monthlyBudget) ?? 0;
  }
  return doc;
}

export const transactionService = {
  async list(userId: string, filters: ListFilters): Promise<ITransaction[]> {
    const query: Record<string, unknown> = scopeFilter(userId, filters.householdId);
    if (filters.year && filters.month) {
      const { start, end } = monthRange(filters.year, filters.month);
      query.date = { $gte: start, $lt: end };
    }
    if (filters.type) query.type = filters.type;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.currency) query.currency = filters.currency;

    const docs = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('categoryId')
      .lean();
    return docs.map((d) =>
      toApi(decryptPopulatedCategory(d as Record<string, unknown>))
    );
  },

  async getById(
    userId: string,
    id: string,
    householdId?: string | null
  ): Promise<ITransaction> {
    const doc = await Transaction.findOne({ _id: id, ...scopeFilter(userId, householdId) })
      .populate('categoryId')
      .lean();
    if (!doc) throw new HttpError(404, 'Movimiento no encontrado');
    return toApi(decryptPopulatedCategory(doc as Record<string, unknown>));
  },

  async create(userId: string, input: CreateTransactionInput): Promise<ITransaction> {
    // Nota: en scope personal la categoría debe ser del usuario; en scope hogar
    // la validamos también contra el userId del creador (cada usuario usa sus
    // propias categorías, incluso cuando el movimiento va al hogar).
    await assertCategoryExists(userId, input.categoryId);
    const payload = {
      userId,
      householdId: input.householdId ?? null,
      type: input.type,
      categoryId: input.categoryId,
      date: input.date,
      currency: input.currency ?? 'ARS',
      recurringId: input.recurringId ?? null,
      rateSource: input.rateSource ?? null,
      amount: encryptNumber(input.amount),
      arsAmount: encryptNumber(input.arsAmount),
      description: encryptField(input.description ?? ''),
      exchangeRate: encryptOptNumber(input.exchangeRate ?? null),
    };
    const doc = await Transaction.create(payload);
    return toApi(doc.toObject());
  },

  async update(
    userId: string,
    id: string,
    input: UpdateTransactionInput,
    householdId?: string | null
  ): Promise<ITransaction> {
    if (input.categoryId) await assertCategoryExists(userId, input.categoryId);
    const doc = await Transaction.findOne({ _id: id, ...scopeFilter(userId, householdId) });
    if (!doc) throw new HttpError(404, 'Movimiento no encontrado');
    if (input.type !== undefined) doc.type = input.type;
    if (input.categoryId !== undefined) doc.categoryId = new Types.ObjectId(input.categoryId);
    if (input.date !== undefined) doc.date = input.date;
    if (input.currency !== undefined) doc.currency = input.currency;
    if (input.rateSource !== undefined) doc.rateSource = input.rateSource;
    if (input.amount !== undefined) doc.amount = encryptNumber(input.amount);
    if (input.arsAmount !== undefined) doc.arsAmount = encryptNumber(input.arsAmount);
    if (input.description !== undefined) doc.description = encryptField(input.description);
    if (input.exchangeRate !== undefined)
      doc.exchangeRate = encryptOptNumber(input.exchangeRate);
    await doc.save();
    return toApi(doc.toObject());
  },

  async remove(userId: string, id: string, householdId?: string | null): Promise<void> {
    const result = await Transaction.findOneAndDelete({
      _id: id,
      ...scopeFilter(userId, householdId),
    });
    if (!result) throw new HttpError(404, 'Movimiento no encontrado');
  },

  async exportCSV(userId: string, filters: ListFilters = {}): Promise<string> {
    const items = await this.list(userId, filters);

    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows: string[] = [
      ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Moneda', 'ARS equivalente', 'Fijo'].join(','),
    ];
    for (const tx of items) {
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
          tx.arsAmount,
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

    // Categorías recientes considera solo movimientos personales del user
    // (para acelerar quick-add, no queremos mezclar categorías del hogar).
    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      householdId: null,
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

  /**
   * Descripciones recientes. Se hace in-memory porque las descripciones están
   * encriptadas y no se puede agrupar en Mongo. Cap a 500 tx recientes.
   */
  async getRecentDescriptions(userId: string, type?: TransactionType, limit = 20): Promise<string[]> {
    const filter: Record<string, unknown> = { userId, householdId: null };
    if (type) filter.type = type;

    const docs = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(500)
      .select('description date')
      .lean();

    const stats = new Map<string, { count: number; last: Date }>();
    for (const d of docs) {
      const desc = decryptField((d as Record<string, unknown>).description).trim();
      if (!desc) continue;
      const existing = stats.get(desc);
      const date = (d as Record<string, unknown>).date as Date;
      if (existing) {
        existing.count += 1;
        if (date > existing.last) existing.last = date;
      } else {
        stats.set(desc, { count: 1, last: date });
      }
    }

    return Array.from(stats.entries())
      .sort((a, b) => b[1].count - a[1].count || b[1].last.getTime() - a[1].last.getTime())
      .slice(0, limit)
      .map(([desc]) => desc);
  },

  /**
   * Summary del mes. Refactoreado a in-memory porque arsAmount está encriptado.
   */
  async getMonthSummary(
    userId: string,
    year: number,
    month: number,
    householdId?: string | null
  ): Promise<MonthSummary> {
    const { start, end } = monthRange(year, month);

    const docs = await Transaction.find({
      ...scopeFilter(userId, householdId),
      date: { $gte: start, $lt: end },
    })
      .select('amount arsAmount type currency')
      .lean();

    const summary: MonthSummary = {
      totalExpense: 0,
      totalIncome: 0,
      balance: 0,
      count: 0,
      usdExpense: 0,
      usdIncome: 0,
    };
    for (const d of docs) {
      const r = d as Record<string, unknown>;
      const arsAmount = decryptNumber(r.arsAmount);
      const originalAmount = decryptNumber(r.amount);
      const isExpense = r.type === 'expense';
      const isUsd = r.currency === 'USD';
      if (isExpense) summary.totalExpense += arsAmount;
      else summary.totalIncome += arsAmount;
      summary.count += 1;
      if (isUsd) {
        if (isExpense) summary.usdExpense += originalAmount;
        else summary.usdIncome += originalAmount;
      }
    }
    summary.balance = summary.totalIncome - summary.totalExpense;
    return summary;
  },

  async getSummaryComparison(
    userId: string,
    year: number,
    month: number,
    householdId?: string | null
  ): Promise<SummaryComparison> {
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };

    const [current, previous, currentByCat, previousByCat] = await Promise.all([
      this.getMonthSummary(userId, year, month, householdId),
      this.getMonthSummary(userId, prev.y, prev.m, householdId),
      this.getCategoryBreakdown(userId, year, month, 'expense', householdId),
      this.getCategoryBreakdown(userId, prev.y, prev.m, 'expense', householdId),
    ]);

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

  async getYearlySummary(
    userId: string,
    year: number,
    householdId?: string | null
  ): Promise<YearlyMonth[]> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const docs = await Transaction.find({
      ...scopeFilter(userId, householdId),
      date: { $gte: start, $lt: end },
    })
      .select('arsAmount type date')
      .lean();

    const byMonth = new Map<number, YearlyMonth>();
    for (let m = 1; m <= 12; m++) {
      byMonth.set(m, { month: m, totalExpense: 0, totalIncome: 0, balance: 0 });
    }
    for (const d of docs) {
      const r = d as Record<string, unknown>;
      const date = r.date as Date;
      const month = date.getUTCMonth() + 1;
      const entry = byMonth.get(month)!;
      const arsAmount = decryptNumber(r.arsAmount);
      if (r.type === 'expense') entry.totalExpense += arsAmount;
      else entry.totalIncome += arsAmount;
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
    householdId?: string | null
  ): Promise<CategoryBreakdownItem[]> {
    const { start, end } = monthRange(year, month);

    const docs = await Transaction.find({
      ...scopeFilter(userId, householdId),
      date: { $gte: start, $lt: end },
      type,
    })
      .select('arsAmount categoryId')
      .populate<{ categoryId: { _id: Types.ObjectId; name: string; icon: string; color: string } }>(
        'categoryId',
        'name icon color'
      )
      .lean();

    const byCat = new Map<string, CategoryBreakdownItem>();
    for (const d of docs) {
      const r = d as unknown as {
        arsAmount: string;
        categoryId: { _id: Types.ObjectId; name: string; icon: string; color: string } | null;
      };
      if (!r.categoryId) continue;
      const catId = r.categoryId._id.toString();
      const arsAmount = decryptNumber(r.arsAmount);
      const existing = byCat.get(catId);
      if (existing) {
        existing.total += arsAmount;
        existing.count += 1;
      } else {
        byCat.set(catId, {
          categoryId: catId,
          categoryName: r.categoryId.name,
          categoryIcon: r.categoryId.icon,
          categoryColor: r.categoryId.color,
          total: arsAmount,
          count: 1,
        });
      }
    }

    return Array.from(byCat.values()).sort((a, b) => b.total - a.total);
  },
};
