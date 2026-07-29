import { Router } from 'express';
import { list, getById, update, returntoStock, getHistory } from '../controllers/packages';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', list);
router.get('/:id', getById);
router.put('/:id', authorize('admin'), update);
router.post('/:id/return-stock', authorize('admin'), returntoStock);
router.get('/:id/history', getHistory);

export default router;
