import { Router } from 'express';
import { getDeliveryRoutes, getDeliveryRouteById, startRoute, finishRoute, updatePackageStatus, editDelivery } from '../controllers/delivery';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../services/photo-storage';

const router = Router();
router.use(authenticate);
router.use(authorize('delivery'));

router.get('/routes', getDeliveryRoutes);
router.get('/routes/:id', getDeliveryRouteById);
router.put('/routes/:id/start', startRoute);
router.put('/routes/:id/finish', finishRoute);
router.put('/routes/:routeId/packages/:packageId', upload.single('photo'), updatePackageStatus);

export default router;

export const adminDeliveryRouter = Router();
adminDeliveryRouter.use(authenticate);
adminDeliveryRouter.use(authorize('admin'));
adminDeliveryRouter.put('/routes/:routeId/packages/:packageId', editDelivery);
