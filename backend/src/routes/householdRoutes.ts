import { Router } from 'express';
import { householdController } from '../controllers/householdController';

const router = Router();

router.get('/', householdController.list);
router.post('/', householdController.create);
router.patch('/:id', householdController.update);
router.delete('/:id', householdController.remove);

router.post('/:id/invite', householdController.invite);
router.delete('/:id/members/:memberId', householdController.removeMember);
router.post('/:id/leave', householdController.leave);

export default router;
