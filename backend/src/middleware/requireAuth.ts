import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { HttpError } from './errorHandler';

/**
 * Middleware que exige un JWT válido en el header Authorization: Bearer <token>.
 * Setea req.userId al ObjectId del usuario si pasa.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Falta token de autenticación');
    }
    const token = header.slice('Bearer '.length).trim();
    const payload = authService.verifyJWT(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    next(err);
  }
}
