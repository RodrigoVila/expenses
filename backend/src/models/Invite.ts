import { Schema, model, Document, Types } from 'mongoose';

export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface IInvite extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  invitedUserId: Types.ObjectId;
  invitedByUserId: Types.ObjectId;
  status: InviteStatus;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
    invitedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Evita duplicados: un solo invite pending por (household, user)
inviteSchema.index(
  { householdId: 1, invitedUserId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export const Invite = model<IInvite>('Invite', inviteSchema);
