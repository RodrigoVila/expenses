import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { householdService } from '../services/householdService';

const createSchema = z.object({
  name: z.string().min(1).max(50),
});
const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
});
const inviteSchema = z.object({
  email: z.string().email(),
});

export const householdController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await householdService.listForUser(req.userId!);
    res.json(items);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const item = await householdService.create(req.userId!, data);
    res.status(201).json(item);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body);
    const item = await householdService.update(req.userId!, req.params.id, data);
    res.json(item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await householdService.remove(req.userId!, req.params.id);
    res.status(204).end();
  }),

  invite: asyncHandler(async (req: Request, res: Response) => {
    const { email } = inviteSchema.parse(req.body);
    const result = await householdService.invite(req.userId!, req.params.id, email);
    res.status(201).json(result);
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    await householdService.removeMember(req.userId!, req.params.id, req.params.memberId);
    res.status(204).end();
  }),

  leave: asyncHandler(async (req: Request, res: Response) => {
    await householdService.leave(req.userId!, req.params.id);
    res.status(204).end();
  }),
};
