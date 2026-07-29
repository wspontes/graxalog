import { Router } from 'express';
import authRoutes from './auth';
import packageRoutes from './packages';
import routeRoutes from './routes';
import deliveryRoutes, { adminDeliveryRouter } from './delivery';
import deliveryPersonRoutes from './delivery-person';
import reportRoutes from './reports';
import importRoutes from './import';

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/routes', routeRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/admin/delivery', adminDeliveryRouter);
router.use('/delivery-people', deliveryPersonRoutes);
router.use('/reports', reportRoutes);
router.use('/import', importRoutes);

export default router;
