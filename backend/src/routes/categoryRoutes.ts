import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';

const router = Router();

router.get('/budget-progress', categoryController.budgetProgress);
router.get('/', categoryController.list);
router.get('/:id', categoryController.getById);
router.post('/', categoryController.create);
router.patch('/:id', categoryController.update);
router.delete('/:id', categoryController.archive); // soft delete

export default router;
