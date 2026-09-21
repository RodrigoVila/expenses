import { Router } from 'express';
import categoryRoutes from './categoryRoutes';
import transactionRoutes from './transactionRoutes';
import recurringRoutes from './recurringRoutes';
import monthBootstrapRoutes from './monthBootstrapRoutes';
import authRoutes from './authRoutes';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Público
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use('/auth', authRoutes);

// Todo lo demás requiere JWT
router.use('/categories', requireAuth, categoryRoutes);
router.use('/transactions', requireAuth, transactionRoutes);
router.use('/recurring', requireAuth, recurringRoutes);
router.use('/months', requireAuth, monthBootstrapRoutes);

export default router;
