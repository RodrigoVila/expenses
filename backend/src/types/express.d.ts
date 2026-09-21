import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Set por el middleware requireAuth cuando la request está autenticada. */
      userId?: string;
    }
  }
}
