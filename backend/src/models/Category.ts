import { Schema, model, Document, Types } from 'mongoose';

export type CategoryType = 'expense' | 'income' | 'both';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  /** Presupuesto mensual base (en ARS por ahora). 0 = sin presupuesto */
  monthlyBudget: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    icon: { type: String, required: true, trim: true },
    color: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
    type: {
      type: String,
      enum: ['expense', 'income', 'both'],
      required: true,
      default: 'expense',
    },
    monthlyBudget: { type: Number, default: 0, min: 0 },
    isDefault: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, isArchived: 1, type: 1 });

export const Category = model<ICategory>('Category', categorySchema);
