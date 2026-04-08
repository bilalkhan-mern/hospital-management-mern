import { Router } from 'express';
import { getAdminStats, getDoctorStats, getPatientStats } from '../controllers/stats.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, authorize('admin', 'doctor', 'patient'));

router.get('/admin', authorize('admin'), getAdminStats);
router.get('/doctor/:id', getDoctorStats);
router.get('/patient/:id', getPatientStats);

export default router;
