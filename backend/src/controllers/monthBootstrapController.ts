import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { monthBootstrapService } from '../services/monthBootstrapService';

const generateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
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
});

export const monthBootstrapController = {
  generateFromRecurring: asyncHandler(async (req: Request, res: Response) => {
    const { year, month } = generateSchema.parse(req.body);
    const result = await monthBootstrapService.generateFromRecurring(req.userId!, year, month);
    res.status(201).json({
      createdCount: result.created.length,
      skippedCount: result.skipped,
      created: result.created,
    });
  }),

  copyMonth: asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = copyMonthSchema.parse(req.body);
    const result = await monthBootstrapService.copyMonth(
      req.userId!,
      from.year,
      from.month,
      to.year,
      to.month
    );
    res.status(201).json({
      createdCount: result.created.length,
      sourceCount: result.sourceCount,
      created: result.created,
    });
  }),
};
