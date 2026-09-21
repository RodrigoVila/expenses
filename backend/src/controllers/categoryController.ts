import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { categoryService } from '../services/categoryService';
import { User } from '../models/User';
import { HttpError } from '../middleware/errorHandler';

const createSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hex tipo #RRGGBB'),
  type: z.enum(['expense', 'income', 'both']).default('expense'),
  monthlyBudget: z.number().min(0).optional().default(0),
});

const updateSchema = createSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

const budgetProgressQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
});

export const categoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const includeArchived = req.query.includeArchived === 'true';
    const categories = await categoryService.list(req.userId!, includeArchived);
    res.json(categories);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.userId!, req.params.id);
    res.json(category);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const category = await categoryService.create(req.userId!, data);
    res.status(201).json(category);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body);
    const category = await categoryService.update(req.userId!, req.params.id, data);
    res.json(category);
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId!);
    if (!user) throw new HttpError(401, 'Usuario no encontrado');
    const category = await categoryService.archive(req.userId!, req.params.id, user.isAdmin);
    res.json(category);
  }),

  budgetProgress: asyncHandler(async (req: Request, res: Response) => {
    const { year, month, currency } = budgetProgressQuerySchema.parse(req.query);
    const data = await categoryService.getBudgetProgress(req.userId!, year, month, currency);
    res.json(data);
  }),
};
