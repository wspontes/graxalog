import { Router } from 'express';
import { list, create, update, resetPassword, performance } from '../controllers/delivery-person';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.put('/:id/reset-password', resetPassword);
router.get('/:id/performance', performance);

export default router;
