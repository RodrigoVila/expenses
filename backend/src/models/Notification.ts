import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'household-invite';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  /** Datos específicos del tipo. Ej para household-invite:
   *  { inviteId, householdId, householdName, invitedByName } */
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['household-invite'], required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
