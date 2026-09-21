import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { notificationService } from '../services/notificationService';
import { inviteService } from '../services/inviteService';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const onlyUnread = req.query.onlyUnread === 'true';
    const items = await notificationService.list(req.userId!, onlyUnread);
    res.json(items);
  }),

  countUnread: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.countUnread(req.userId!);
    res.json({ count });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(req.userId!, req.params.id);
    res.status(204).end();
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.markAllRead(req.userId!);
    res.json({ count });
  }),

  acceptInvite: asyncHandler(async (req: Request, res: Response) => {
    const result = await inviteService.accept(req.userId!, req.params.inviteId);
    res.json(result);
  }),

  rejectInvite: asyncHandler(async (req: Request, res: Response) => {
    await inviteService.reject(req.userId!, req.params.inviteId);
    res.status(204).end();
  }),
};
