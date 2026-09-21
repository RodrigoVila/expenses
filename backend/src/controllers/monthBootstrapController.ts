import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { monthBootstrapService } from '../services/monthBootstrapService';
import { householdService } from '../services/householdService';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

async function resolveScope(req: Request, raw?: string | null): Promise<string | null> {
  if (!raw) return null;
  await householdService.assertMember(req.userId!, raw);
  return raw;
}

const generateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  householdId: objectIdSchema.nullable().optional(),
});

const copyMonthSchema = z.object({
  from: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
  }),
  to: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
  }),
  householdId: objectIdSchema.nullable().optional(),
});

export const monthBootstrapController = {
  generateFromRecurring: asyncHandler(async (req: Request, res: Response) => {
    const { year, month, householdId: hid } = generateSchema.parse(req.body);
    const householdId = await resolveScope(req, hid);
    const result = await monthBootstrapService.generateFromRecurring(
      req.userId!,
      year,
      month,
      householdId
    );
    res.status(201).json({
      createdCount: result.createdCount,
      skippedCount: result.skippedCount,
    });
  }),

  copyMonth: asyncHandler(async (req: Request, res: Response) => {
    const { from, to, householdId: hid } = copyMonthSchema.parse(req.body);
    const householdId = await resolveScope(req, hid);
    const result = await monthBootstrapService.copyMonth(
      req.userId!,
      from.year,
      from.month,
      to.year,
      to.month,
      householdId
    );
    res.status(201).json({
      createdCount: result.createdCount,
      sourceCount: result.sourceCount,
    });
  }),
};
