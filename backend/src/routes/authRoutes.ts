import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/google', authController.loginWithGoogle);
router.get('/me', requireAuth, authController.me);

export default router;
