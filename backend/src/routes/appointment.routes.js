import { Router } from 'express';
import { getAppointmentById, getAppointmentsByRole } from '../controllers/appointment.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, authorize('admin', 'doctor', 'patient'));
router.get('/', getAppointmentsByRole);
router.get('/:id', getAppointmentById);

export default router;
