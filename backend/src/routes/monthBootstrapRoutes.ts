import { Router } from 'express';
import { monthBootstrapController } from '../controllers/monthBootstrapController';

const router = Router();

router.post('/generate-from-recurring', monthBootstrapController.generateFromRecurring);
router.post('/copy-month', monthBootstrapController.copyMonth);

export default router;
