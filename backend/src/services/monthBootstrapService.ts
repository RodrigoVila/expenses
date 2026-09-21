import { Transaction, type ITransaction } from '../models/Transaction';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { monthRange, buildDateInMonth } from '../utils/dateRange';

export interface GenerateRecurringResult {
  created: ITransaction[];
  skipped: number;
}

export interface CopyMonthResult {
  created: ITransaction[];
  sourceCount: number;
}

export const monthBootstrapService = {
  async generateFromRecurring(
    userId: string,
    year: number,
    month: number
  ): Promise<GenerateRecurringResult> {
    const { start: monthStart, end: monthEnd } = monthRange(year, month);

    const recurrings = await RecurringTransaction.find({
      userId,
      isActive: true,
      startDate: { $lt: monthEnd },
      $or: [{ endDate: null }, { endDate: { $gte: monthStart } }],
    });

    const created: ITransaction[] = [];
    let skipped = 0;

    for (const r of recurrings) {
      const exists = await Transaction.findOne({
        userId,
        recurringId: r._id,
        date: { $gte: monthStart, $lt: monthEnd },
      });
      if (exists) {
        skipped++;
        continue;
      }
      const tx = await Transaction.create({
        userId,
        amount: r.amount,
        type: r.type,
        categoryId: r.categoryId,
        description: r.description,
        date: buildDateInMonth(year, month, r.dayOfMonth),
        currency: r.currency,
        recurringId: r._id,
      });
      created.push(tx);
    }

    return { created, skipped };
  },

  async copyMonth(
    userId: string,
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number
  ): Promise<CopyMonthResult> {
    const { start: fromStart, end: fromEnd } = monthRange(fromYear, fromMonth);

    const source = await Transaction.find({
      userId,
      date: { $gte: fromStart, $lt: fromEnd },
    });

    const created: ITransaction[] = [];
    for (const tx of source) {
      const originalDay = new Date(tx.date).getUTCDate();
      const newDate = buildDateInMonth(toYear, toMonth, originalDay);
      const copy = await Transaction.create({
        userId,
        amount: tx.amount,
        type: tx.type,
        categoryId: tx.categoryId,
        description: tx.description,
        date: newDate,
        currency: tx.currency,
        recurringId: null,
      });
      created.push(copy);
    }

    return { created, sourceCount: source.length };
  },
};
