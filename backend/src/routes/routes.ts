import { Router } from 'express';
import { list, getById, create, updateRoute, reorderPackages, transferRoute, splitRoute } from '../controllers/routes';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', updateRoute);
router.put('/:id/reorder', reorderPackages);
router.put('/:id/transfer', transferRoute);
router.post('/:id/split', splitRoute);

export default router;
