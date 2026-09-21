import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';

const router = Router();

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.countUnread);
router.post('/mark-all-read', notificationController.markAllRead);
router.post('/:id/read', notificationController.markRead);

// Acciones sobre invites (viven bajo notifications para simplificar el UX)
router.post('/invites/:inviteId/accept', notificationController.acceptInvite);
router.post('/invites/:inviteId/reject', notificationController.rejectInvite);

export default router;
