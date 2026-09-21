import { Types } from 'mongoose';
import { Invite, type IInvite } from '../models/Invite';
import { Household } from '../models/Household';
import { HttpError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';

export const inviteService = {
  /**
   * Invites pending que apuntan al userId (para mostrar en la bandeja).
   */
  async listPendingForUser(userId: string): Promise<IInvite[]> {
    return Invite.find({ invitedUserId: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .lean() as unknown as IInvite[];
  },

  async accept(userId: string, inviteId: string): Promise<{ householdId: string }> {
    const invite = await Invite.findOne({
      _id: inviteId,
      invitedUserId: userId,
      status: 'pending',
    });
    if (!invite) throw new HttpError(404, 'Invitación no encontrada o ya respondida');

    // Agregar al usuario al household
    await Household.updateOne(
      { _id: invite.householdId },
      { $addToSet: { memberIds: new Types.ObjectId(userId) } }
    );

    invite.status = 'accepted';
    invite.respondedAt = new Date();
    await invite.save();

    // Borrar notificación del invite (ya está respondido)
    await notificationService.removeByPayloadField(
      userId,
      'household-invite',
      'inviteId',
      invite._id.toString()
    );

    return { householdId: invite.householdId.toString() };
  },

  async reject(userId: string, inviteId: string): Promise<void> {
    const invite = await Invite.findOne({
      _id: inviteId,
      invitedUserId: userId,
      status: 'pending',
    });
    if (!invite) throw new HttpError(404, 'Invitación no encontrada o ya respondida');

    invite.status = 'rejected';
    invite.respondedAt = new Date();
    await invite.save();

    await notificationService.removeByPayloadField(
      userId,
      'household-invite',
      'inviteId',
      invite._id.toString()
    );
  },
};
