import { Schema, model, Document, Types } from 'mongoose';

export type TransactionType = 'expense' | 'income';
export type Currency = 'ARS' | 'USD';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  /** Si está seteado, el movimiento pertenece al hogar (todos los miembros lo ven).
   *  Si es null, es personal del userId. */
  householdId: Types.ObjectId | null;
  amount: number;
  type: TransactionType;
  categoryId: Types.ObjectId;
  description: string;
  date: Date;
  currency: Currency;
  arsAmount: number;
  exchangeRate: number | null;
  rateSource: string | null;
  recurringId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// Los campos sensibles son String (ciphertext AES-256-GCM). Ver utils/crypto.ts.
const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', default: null, index: true },
    amount: { type: String, required: true }, // encrypted number
    type: { type: String, enum: ['expense', 'income'], required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: { type: String, default: '' }, // encrypted string
    date: { type: Date, required: true, index: true },
    currency: {
      type: String,
      enum: ['ARS', 'USD'],
      required: true,
      default: 'ARS',
    },
    arsAmount: { type: String, required: true }, // encrypted number
    exchangeRate: { type: String, default: null }, // encrypted number | null
    rateSource: { type: String, default: null }, // NO encriptado (metadata técnica)
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

// Nota: el schema guarda los sensibles como String (encrypted).
// El type ITransaction expone la interfaz "post-decrypt" (numbers/strings planos)
// que devuelve el service layer después de aplicar decryptField.
export const Transaction = model('Transaction', transactionSchema);
