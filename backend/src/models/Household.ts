import { Schema, model, Document, Types } from 'mongoose';

export interface IHousehold extends Document {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  memberIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const householdSchema = new Schema<IHousehold>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  },
  { timestamps: true }
);

// Index para buscar rápido los hogares donde el usuario es miembro
householdSchema.index({ memberIds: 1 });

export const Household = model<IHousehold>('Household', householdSchema);
