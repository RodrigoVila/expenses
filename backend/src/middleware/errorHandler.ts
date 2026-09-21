import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validación falló',
      issues: err.issues,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: 'Validación de Mongoose falló',
      issues: err.errors,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `ID inválido: ${err.value}` });
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
