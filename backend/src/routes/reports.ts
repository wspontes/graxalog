import { Router } from 'express';
import { dashboard, deliveryByPeriod, deliveryPersonPerformance, averageRouteTime, exportPackages } from '../controllers/reports';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', dashboard);
router.get('/delivery-by-period', deliveryByPeriod);
router.get('/delivery-person-performance', deliveryPersonPerformance);
router.get('/average-route-time', averageRouteTime);
router.get('/export', exportPackages);

export default router;
