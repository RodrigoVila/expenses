import { Types } from 'mongoose';
import { Household, type IHousehold } from '../models/Household';
import { Invite } from '../models/Invite';
import { User } from '../models/User';
import { HttpError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';

export interface CreateHouseholdInput {
  name: string;
}

export interface UpdateHouseholdInput {
  name?: string;
}

export interface HouseholdWithMembers extends Omit<IHousehold, 'memberIds'> {
  members: Array<{ _id: string; email: string; name: string; picture: string | null }>;
  isOwner: boolean;
}

async function assertMember(userId: string, householdId: string): Promise<IHousehold> {
  const household = await Household.findOne({
    _id: householdId,
    memberIds: userId,
  });
  if (!household) throw new HttpError(404, 'Hogar no encontrado o no sos miembro');
  return household;
}

async function assertOwner(userId: string, householdId: string): Promise<IHousehold> {
  const household = await Household.findOne({ _id: householdId, ownerId: userId });
  if (!household) throw new HttpError(403, 'Solo el dueño del hogar puede hacer esto');
  return household;
}

export const householdService = {
  async listForUser(userId: string): Promise<HouseholdWithMembers[]> {
    const households = await Household.find({ memberIds: userId })
      .sort({ createdAt: 1 })
      .lean();
    if (households.length === 0) return [];

    const allMemberIds = Array.from(
      new Set(households.flatMap((h) => h.memberIds.map((id) => id.toString())))
    );
    const users = await User.find({ _id: { $in: allMemberIds } }).lean();
    const usersById = new Map(
      users.map((u) => [
        u._id.toString(),
        {
          _id: u._id.toString(),
          email: u.email,
          name: u.name,
          picture: u.picture,
        },
      ])
    );

    return households.map((h) => ({
      ...(h as unknown as IHousehold),
      members: h.memberIds
        .map((id) => usersById.get(id.toString()))
        .filter((u): u is NonNullable<typeof u> => !!u),
      isOwner: h.ownerId.toString() === userId,
    })) as unknown as HouseholdWithMembers[];
  },

  async create(userId: string, input: CreateHouseholdInput): Promise<IHousehold> {
    const doc = await Household.create({
      name: input.name.trim(),
      ownerId: userId,
      memberIds: [new Types.ObjectId(userId)],
    });
    return doc.toObject() as unknown as IHousehold;
  },

  async update(userId: string, id: string, input: UpdateHouseholdInput): Promise<IHousehold> {
    const household = await assertOwner(userId, id);
    if (input.name !== undefined) household.name = input.name.trim();
    await household.save();
    return household.toObject() as unknown as IHousehold;
  },

  async remove(userId: string, id: string): Promise<void> {
    await assertOwner(userId, id);
    // Borra también invites pending y notifs asociadas
    const pendingInvites = await Invite.find({ householdId: id, status: 'pending' });
    for (const inv of pendingInvites) {
      await notificationService.removeByPayloadField(
        inv.invitedUserId.toString(),
        'household-invite',
        'inviteId',
        inv._id.toString()
      );
    }
    await Invite.deleteMany({ householdId: id });
    await Household.deleteOne({ _id: id });
    // Nota: transactions/recurring del hogar quedan (no las tocamos).
    // Podríamos setearles householdId=null si quisiéramos "adoptarlas" al personal.
  },

  /**
   * Envía un invite a un usuario por email. Crea la Invite pending + una Notification
   * en la bandeja del invitado. No hace mail — todo in-app.
   */
  async invite(
    userId: string,
    householdId: string,
    email: string
  ): Promise<{ inviteId: string }> {
    const household = await assertOwner(userId, householdId);

    const invitedUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!invitedUser) {
      throw new HttpError(
        404,
        'No hay ningún usuario con ese email registrado. Deben haber ingresado al menos una vez a la app.'
      );
    }

    if (invitedUser._id.toString() === userId) {
      throw new HttpError(400, 'No podés invitarte a vos mismo');
    }
    if (household.memberIds.some((m) => m.toString() === invitedUser._id.toString())) {
      throw new HttpError(400, 'Ese usuario ya es miembro del hogar');
    }

    const inviter = await User.findById(userId);
    if (!inviter) throw new HttpError(500, 'Usuario inviter no encontrado');

    let invite;
    try {
      invite = await Invite.create({
        householdId: household._id,
        invitedUserId: invitedUser._id,
        invitedByUserId: userId,
      });
    } catch (err) {
      // duplicate key → ya hay un invite pending para ese usuario/hogar
      if ((err as { code?: number }).code === 11000) {
        throw new HttpError(400, 'Ya hay una invitación pendiente para ese usuario');
      }
      throw err;
    }

    await notificationService.create(invitedUser._id.toString(), 'household-invite', {
      inviteId: invite._id,
      householdId: household._id,
      householdName: household.name,
      invitedByName: inviter.name,
      invitedByEmail: inviter.email,
    });

    return { inviteId: invite._id.toString() };
  },

  async removeMember(userId: string, householdId: string, memberId: string): Promise<void> {
    const household = await assertOwner(userId, householdId);
    if (household.ownerId.toString() === memberId) {
      throw new HttpError(400, 'No podés quitar al dueño del hogar. Borrá el hogar directamente.');
    }
    await Household.updateOne(
      { _id: householdId },
      { $pull: { memberIds: new Types.ObjectId(memberId) } }
    );
  },

  async leave(userId: string, householdId: string): Promise<void> {
    const household = await assertMember(userId, householdId);
    if (household.ownerId.toString() === userId) {
      throw new HttpError(400, 'El dueño no puede salirse. Borrá el hogar o transferí la propiedad.');
    }
    await Household.updateOne(
      { _id: householdId },
      { $pull: { memberIds: new Types.ObjectId(userId) } }
    );
  },

  assertMember,
  assertOwner,
};
