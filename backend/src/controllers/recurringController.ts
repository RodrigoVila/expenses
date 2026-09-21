import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { recurringService } from '../services/recurringService';
import { householdService } from '../services/householdService';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

async function resolveScope(req: Request, raw?: string | null): Promise<string | null> {
  if (!raw) return null;
  await householdService.assertMember(req.userId!, raw);
  return raw;
}

const createSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['expense', 'income']),
  categoryId: objectIdSchema,
  description: z.string().max(200).optional().default(''),
  dayOfMonth: z.number().int().min(1).max(31),
  currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  householdId: objectIdSchema.nullable().optional(),
});

const updateSchema = createSchema.partial();

export const recurringController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const activeOnly = req.query.activeOnly === 'true';
    const householdId = await resolveScope(req, req.query.householdId as string | undefined);
    const items = await recurringService.list(req.userId!, activeOnly, householdId);
    res.json(items);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const householdId = await resolveScope(req, req.query.householdId as string | undefined);
    const item = await recurringService.getById(req.userId!, req.params.id, householdId);
    res.json(item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const householdId = await resolveScope(req, data.householdId);
    const item = await recurringService.create(req.userId!, { ...data, householdId });
    res.status(201).json(item);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body);
    const householdId = await resolveScope(req, data.householdId);
    const item = await recurringService.update(req.userId!, req.params.id, data, householdId);
    res.json(item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const householdId = await resolveScope(req, req.query.householdId as string | undefined);
    await recurringService.remove(req.userId!, req.params.id, householdId);
    res.status(204).end();
  }),
};
