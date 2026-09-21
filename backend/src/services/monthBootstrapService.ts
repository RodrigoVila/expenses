import { Transaction } from '../models/Transaction';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { monthRange, buildDateInMonth } from '../utils/dateRange';
import { scopeFilter } from '../utils/scope';
import { dolarService, type DolarType } from './dolarService';
import {
  decryptField,
  decryptNumber,
  encryptField,
  encryptNumber,
  encryptOptNumber,
} from '../utils/crypto';
import type { Types } from 'mongoose';

const DEFAULT_USD_RATE_TYPE: DolarType = 'blue';

export interface GenerateRecurringResult {
  createdCount: number;
  skippedCount: number;
}

export interface CopyMonthResult {
  createdCount: number;
  sourceCount: number;
}

async function convertToArs(
  amount: number,
  currency: 'ARS' | 'USD'
): Promise<{ arsAmount: number; exchangeRate: number | null; rateSource: string | null }> {
  if (currency === 'ARS') {
    return { arsAmount: amount, exchangeRate: null, rateSource: null };
  }
  try {
    const rate = await dolarService.getRate(DEFAULT_USD_RATE_TYPE);
    return {
      arsAmount: amount * rate.venta,
      exchangeRate: rate.venta,
      rateSource: DEFAULT_USD_RATE_TYPE,
    };
  } catch {
    return { arsAmount: amount, exchangeRate: null, rateSource: null };
  }
}

/** Payload encriptado listo para Transaction.create */
function encryptedTxPayload(args: {
  userId: string;
  householdId: string | null;
  amount: number;
  arsAmount: number;
  exchangeRate: number | null;
  rateSource: string | null;
  description: string;
  type: 'expense' | 'income';
  categoryId: Types.ObjectId;
  date: Date;
  currency: 'ARS' | 'USD';
  recurringId: Types.ObjectId | null;
}) {
  return {
    userId: args.userId,
    householdId: args.householdId,
    type: args.type,
    categoryId: args.categoryId,
    date: args.date,
    currency: args.currency,
    recurringId: args.recurringId,
    rateSource: args.rateSource,
    amount: encryptNumber(args.amount),
    arsAmount: encryptNumber(args.arsAmount),
    exchangeRate: encryptOptNumber(args.exchangeRate),
    description: encryptField(args.description),
  };
}

export const monthBootstrapService = {
  async generateFromRecurring(
    userId: string,
    year: number,
    month: number,
    householdId?: string | null
  ): Promise<GenerateRecurringResult> {
    const { start: monthStart, end: monthEnd } = monthRange(year, month);

    const recurrings = await RecurringTransaction.find({
      ...scopeFilter(userId, householdId),
      isActive: true,
      startDate: { $lt: monthEnd },
      $or: [{ endDate: null }, { endDate: { $gte: monthStart } }],
    });

    let createdCount = 0;
    let skipped = 0;

    for (const r of recurrings) {
      const exists = await Transaction.findOne({
        ...scopeFilter(userId, householdId),
        recurringId: r._id,
        date: { $gte: monthStart, $lt: monthEnd },
      });
      if (exists) {
        skipped++;
        continue;
      }
      const amount = decryptNumber(r.amount);
      const description = decryptField(r.description);
      const conv = await convertToArs(amount, r.currency);

      await Transaction.create(
        encryptedTxPayload({
          userId,
          householdId: householdId ?? null,
          amount,
          arsAmount: conv.arsAmount,
          exchangeRate: conv.exchangeRate,
          rateSource: conv.rateSource,
          description,
          type: r.type,
          categoryId: r.categoryId,
          date: buildDateInMonth(year, month, r.dayOfMonth),
          currency: r.currency,
          recurringId: r._id,
        })
      );
      createdCount++;
    }

    return { createdCount, skippedCount: skipped };
  },

  async copyMonth(
    userId: string,
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number,
    householdId?: string | null
  ): Promise<CopyMonthResult> {
    const { start: fromStart, end: fromEnd } = monthRange(fromYear, fromMonth);

    const source = await Transaction.find({
      ...scopeFilter(userId, householdId),
      date: { $gte: fromStart, $lt: fromEnd },
    });

    let createdCount = 0;
    for (const tx of source) {
      const amount = decryptNumber(tx.amount);
      const description = decryptField(tx.description);
      const originalDay = new Date(tx.date).getUTCDate();
      const newDate = buildDateInMonth(toYear, toMonth, originalDay);

      const conv = await convertToArs(amount, tx.currency);

      await Transaction.create(
        encryptedTxPayload({
          userId,
          householdId: householdId ?? null,
          amount,
          arsAmount: conv.arsAmount,
          exchangeRate: conv.exchangeRate,
          rateSource: conv.rateSource,
          description,
          type: tx.type,
          categoryId: tx.categoryId,
          date: newDate,
          currency: tx.currency,
          recurringId: null,
        })
      );
      createdCount++;
    }

    return { createdCount, sourceCount: source.length };
  },
};
