import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { transactionService } from '../services/transactionService';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

const createSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['expense', 'income']),
  categoryId: objectIdSchema,
  description: z.string().max(200).optional().default(''),
  date: z.coerce.date(),
  currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
});

const updateSchema = createSchema.partial();

const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const listQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  type: z.enum(['expense', 'income']).optional(),
  categoryId: objectIdSchema.optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
});

export const transactionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = listQuerySchema.parse(req.query);
    const items = await transactionService.list(req.userId!, filters);
    res.json(items);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await transactionService.getById(req.userId!, req.params.id);
    res.json(item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const item = await transactionService.create(req.userId!, data);
    res.status(201).json(item);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body);
    const item = await transactionService.update(req.userId!, req.params.id, data);
    res.json(item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await transactionService.remove(req.userId!, req.params.id);
    res.status(204).end();
  }),

  exportCSV: asyncHandler(async (req: Request, res: Response) => {
    const filters = listQuerySchema.parse(req.query);
    const csv = await transactionService.exportCSV(req.userId!, filters);
    const yearPart = filters.year ? `-${filters.year}` : '';
    const monthPart = filters.month ? `-${String(filters.month).padStart(2, '0')}` : '';
    const filename = `movimientos${yearPart}${monthPart}.csv`;
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
    const { year, month } = monthQuerySchema.parse(req.query);
    const summary = await transactionService.getMonthSummary(req.userId!, year, month);
    res.json(summary);
  }),

  summaryComparison: asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      year: z.coerce.number().int().min(2000).max(2100),
      month: z.coerce.number().int().min(1).max(12),
      currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
    });
    const { year, month, currency } = schema.parse(req.query);
    const data = await transactionService.getSummaryComparison(req.userId!, year, month, currency);
    res.json(data);
  }),

  yearlySummary: asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      year: z.coerce.number().int().min(2000).max(2100),
      currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
    });
    const { year, currency } = schema.parse(req.query);
    const data = await transactionService.getYearlySummary(req.userId!, year, currency);
    res.json(data);
  }),

  byCategory: asyncHandler(async (req: Request, res: Response) => {
    const schema = monthQuerySchema.extend({
      type: z.enum(['expense', 'income']).optional().default('expense'),
      currency: z.enum(['ARS', 'USD']).optional().default('ARS'),
    });
    const { year, month, type, currency } = schema.parse(req.query);
    const items = await transactionService.getCategoryBreakdown(req.userId!, year, month, type, currency);
    res.json(items);
  }),
};
