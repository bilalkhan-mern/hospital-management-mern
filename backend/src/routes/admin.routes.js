import { Router } from 'express';
import {
  approveDoctor,
  activateAdminUser,
  createAdminUser,
  createDoctor,
  deactivateAdminUser,
  deleteDoctor,
  deleteAdminUser,
  getAdminDashboard,
  getAdmins,
  getAllAppointments,
  getAuditLogs,
  getDoctors,
  getPatients,
  getPendingDoctors,
  rejectDoctor,
  updateAppointmentPayment,
  updateDoctor,
} from '../controllers/admin.controller.js';
import { authorize, protect, requireSuperAdmin } from '../middleware/auth.middleware.js';
import { adminCreateSchema, appointmentPaymentSchema, doctorSchema, doctorUpdateSchema, validate } from '../validators/index.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/doctors', getDoctors);
router.get('/doctors/pending', getPendingDoctors);
router.post('/doctors', validate(doctorSchema), createDoctor);
router.put('/doctors/:id', validate(doctorUpdateSchema), updateDoctor);
router.patch('/doctors/:id/approve', approveDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.delete('/doctors/:id/reject', rejectDoctor);
router.get('/patients', getPatients);
router.get('/appointments', getAllAppointments);
router.get('/audit-logs', getAuditLogs);
router.patch('/appointments/:id/payment', validate(appointmentPaymentSchema), updateAppointmentPayment);
router.get('/admins', requireSuperAdmin, getAdmins);
router.post('/admins', requireSuperAdmin, validate(adminCreateSchema), createAdminUser);
router.patch('/admins/:id/deactivate', requireSuperAdmin, deactivateAdminUser);
router.patch('/admins/:id/activate', requireSuperAdmin, activateAdminUser);
router.delete('/admins/:id', requireSuperAdmin, deleteAdminUser);

export default router;
