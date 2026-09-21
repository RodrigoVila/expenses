import { Schema, model, Document, Types } from 'mongoose';

export type TransactionType = 'expense' | 'income';
export type Currency = 'ARS' | 'USD';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  type: TransactionType;
  categoryId: Types.ObjectId;
  description: string;
  date: Date;
  currency: Currency;
  recurringId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['expense', 'income'], required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    date: { type: Date, required: true, index: true },
    currency: {
      type: String,
      enum: ['ARS', 'USD'],
      required: true,
      default: 'ARS',
    },
    recurringId: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
      default: null,
    },
  },
  { timestamps: true }
);

// Index para queries por usuario + rango de fecha + tipo
transactionSchema.index({ userId: 1, date: -1, type: 1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
