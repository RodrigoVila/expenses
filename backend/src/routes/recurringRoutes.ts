import { Router } from 'express';
import { recurringController } from '../controllers/recurringController';

const router = Router();

router.get('/', recurringController.list);
router.get('/:id', recurringController.getById);
router.post('/', recurringController.create);
router.patch('/:id', recurringController.update);
router.delete('/:id', recurringController.remove);

export default router;
