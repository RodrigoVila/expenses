import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';

const router = Router();

// Stats / agregados — antes de /:id para que no chocan
router.get('/summary', transactionController.summary);
router.get('/summary-comparison', transactionController.summaryComparison);
router.get('/by-category', transactionController.byCategory);
router.get('/yearly-summary', transactionController.yearlySummary);
router.get('/recent-categories', transactionController.recentCategories);
router.get('/recent-descriptions', transactionController.recentDescriptions);
router.get('/export.csv', transactionController.exportCSV);

router.get('/', transactionController.list);
router.get('/:id', transactionController.getById);
router.post('/', transactionController.create);
router.patch('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;
