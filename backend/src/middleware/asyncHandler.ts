import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve handlers async para que los errores pasen al errorHandler
 * sin necesidad de try/catch en cada controller.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
