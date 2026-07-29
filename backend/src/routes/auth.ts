import { Router } from 'express';
import { login, changePassword, me } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.put('/password', authenticate, changePassword);
router.get('/me', authenticate, me);

export default router;
