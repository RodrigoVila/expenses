import { Schema, model, Document, Types } from 'mongoose';
import type { TransactionType, Currency } from './Transaction';

export interface IRecurringTransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  householdId: Types.ObjectId | null;
  amount: number;
  type: TransactionType;
  categoryId: Types.ObjectId;
  description: string;
  dayOfMonth: number;
  currency: Currency;
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const recurringSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', default: null, index: true },
    amount: { type: String, required: true }, // encrypted number
    type: { type: String, enum: ['expense', 'income'], required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: { type: String, default: '' }, // encrypted string
    dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    currency: {
      type: String,
      enum: ['ARS', 'USD'],
      required: true,
      default: 'ARS',
    },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export const RecurringTransaction = model('RecurringTransaction', recurringSchema);
