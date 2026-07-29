import { Router } from 'express';
import { importFile, manualImport, uploadPhoto } from '../controllers/import';
import { conferPackages, addDivergentPackage, getConferenceStatus, finishConference } from '../controllers/conference';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../services/photo-storage';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.post('/file', upload.single('file'), importFile);
router.post('/manual', upload.single('photo'), manualImport);
router.post('/photo', upload.single('photo'), uploadPhoto);
router.post('/conference', conferPackages);
router.post('/conference/divergent', addDivergentPackage);
router.get('/conference/status', getConferenceStatus);
router.post('/conference/finish', finishConference);

export default router;
