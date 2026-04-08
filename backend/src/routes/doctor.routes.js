import { Router } from 'express';
import {
  addPrescription,
  getDoctorAppointments,
  getDoctorProfile,
  getPatientHistory,
  rescheduleDoctorAppointment,
  updateAppointmentStatus,
  updateDoctorProfile,
} from '../controllers/doctor.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { appointmentRescheduleSchema, appointmentStatusSchema, doctorProfileSchema, prescriptionSchema, validate } from '../validators/index.js';

const router = Router();

router.use(protect, authorize('doctor'));

router.get('/profile', getDoctorProfile);
router.put('/profile', validate(doctorProfileSchema), updateDoctorProfile);
router.get('/appointments', getDoctorAppointments);
router.patch('/appointments/:id/status', validate(appointmentStatusSchema), updateAppointmentStatus);
router.patch('/appointments/:id/reschedule', validate(appointmentRescheduleSchema), rescheduleDoctorAppointment);
router.post('/prescriptions', validate(prescriptionSchema), addPrescription);
router.get('/patients/:patientId/history', getPatientHistory);

export default router;
