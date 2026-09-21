import { Notification, type INotification, type NotificationType } from '../models/Notification';
import { Types } from 'mongoose';

export const notificationService = {
  async list(userId: string, onlyUnread = false): Promise<INotification[]> {
    const filter: Record<string, unknown> = { userId };
    if (onlyUnread) filter.readAt = null;
    return Notification.find(filter).sort({ createdAt: -1 }).lean() as unknown as INotification[];
  },

  async countUnread(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, readAt: null });
  },

  async create(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>
  ): Promise<INotification> {
    const doc = await Notification.create({ userId, type, payload });
    return doc.toObject() as unknown as INotification;
  },

  async markRead(userId: string, id: string): Promise<void> {
    await Notification.updateOne(
      { _id: id, userId, readAt: null },
      { $set: { readAt: new Date() } }
    );
  },

  async markAllRead(userId: string): Promise<number> {
    const res = await Notification.updateMany(
      { userId, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.modifiedCount;
  },

  async removeByPayloadField(
    userId: string,
    type: NotificationType,
    field: string,
    value: string
  ): Promise<void> {
    await Notification.deleteMany({
      userId,
      type,
      [`payload.${field}`]: new Types.ObjectId(value),
    });
  },
};
