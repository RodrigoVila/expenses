import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { transactionService } from '../services/transactionService';
import { householdService } from '../services/householdService';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

/**
 * Si la request trae householdId (query o body), verifica que el user
 * autenticado sea miembro. Sino, es scope personal (devuelve null).
 */
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
  date: z.coerce.date(),
  currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
  arsAmount: z.number().positive(),
  exchangeRate: z.number().positive().nullable().optional(),
  rateSource: z.string().nullable().optional(),
  householdId: objectIdSchema.nullable().optional(),
});

const updateSchema = createSchema.partial();

const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  householdId: objectIdSchema.optional(),
});

const listQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  type: z.enum(['expense', 'income']).optional(),
  categoryId: objectIdSchema.optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  householdId: objectIdSchema.optional(),
});

export const transactionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = listQuerySchema.parse(req.query);
    const householdId = await resolveScope(req, filters.householdId);
    const items = await transactionService.list(req.userId!, { ...filters, householdId });
    res.json(items);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const householdId = await resolveScope(req, req.query.householdId as string | undefined);
    const item = await transactionService.getById(req.userId!, req.params.id, householdId);
    res.json(item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const householdId = await resolveScope(req, data.householdId);
    const item = await transactionService.create(req.userId!, { ...data, householdId });
    res.status(201).json(item);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body);
    const householdId = await resolveScope(req, data.householdId);
    const item = await transactionService.update(req.userId!, req.params.id, data, householdId);
    res.json(item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const householdId = await resolveScope(req, req.query.householdId as string | undefined);
    await transactionService.remove(req.userId!, req.params.id, householdId);
    res.status(204).end();
  }),

  exportCSV: asyncHandler(async (req: Request, res: Response) => {
    const filters = listQuerySchema.parse(req.query);
    const householdId = await resolveScope(req, filters.householdId);
    const csv = await transactionService.exportCSV(req.userId!, { ...filters, householdId });
    const yearPart = filters.year ? `-${filters.year}` : '';
    const monthPart = filters.month ? `-${String(filters.month).padStart(2, '0')}` : '';
    const scopePart = householdId ? '-hogar' : '';
    const filename = `movimientos${scopePart}${yearPart}${monthPart}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv);
  }),

  recentCategories: asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      type: z.enum(['expense', 'income']).optional(),
      limit: z.coerce.number().int().min(1).max(20).optional().default(5),
    });
    const { type, limit } = schema.parse(req.query);
    const ids = await transactionService.getRecentCategoryIds(req.userId!, type, limit);
    res.json(ids);
  }),

  recentDescriptions: asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      type: z.enum(['expense', 'income']).optional(),
      limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    });
    const { type, limit } = schema.parse(req.query);
    const items = await transactionService.getRecentDescriptions(req.userId!, type, limit);
    res.json(items);
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const { year, month, householdId: hid } = monthQuerySchema.parse(req.query);
    const householdId = await resolveScope(req, hid);
    const summary = await transactionService.getMonthSummary(
      req.userId!,
      year,
      month,
      householdId
    );
    res.json(summary);
  }),

  summaryComparison: asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      year: z.coerce.number().int().min(2000).max(2100),
      month: z.coerce.number().int().min(1).max(12),
      householdId: objectIdSchema.optional(),
    });
    const { year, month, householdId: hid } = schema.parse(req.query);
    const householdId = await resolveScope(req, hid);
    const data = await transactionService.getSummaryComparison(
      req.userId!,
      year,
      month,
      householdId
    );
    res.json(data);
  }),

  yearlySummary: asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      year: z.coerce.number().int().min(2000).max(2100),
      householdId: objectIdSchema.optional(),
    });
    const { year, householdId: hid } = schema.parse(req.query);
    const householdId = await resolveScope(req, hid);
    const data = await transactionService.getYearlySummary(req.userId!, year, householdId);
    res.json(data);
  }),

  byCategory: asyncHandler(async (req: Request, res: Response) => {
    const schema = monthQuerySchema.extend({
      type: z.enum(['expense', 'income']).optional().default('expense'),
    });
    const { year, month, type, householdId: hid } = schema.parse(req.query);
    const householdId = await resolveScope(req, hid);
    const items = await transactionService.getCategoryBreakdown(
      req.userId!,
      year,
      month,
      type,
      householdId
    );
    res.json(items);
  }),
};
