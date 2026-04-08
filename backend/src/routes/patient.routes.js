import { Router } from 'express';
import {
  bookAppointment,
  cancelPatientAppointment,
  getDoctorAvailableSlots,
  getPatientAppointments,
  updatePatientAppointmentPayment,
  getPatientPrescriptions,
  getPatientProfile,
  getPublicDoctors,
  reschedulePatientAppointment,
  updatePatientProfile,
} from '../controllers/patient.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { appointmentPaymentSchema, appointmentRescheduleSchema, appointmentSchema, patientProfileSchema, validate } from '../validators/index.js';

const router = Router();

router.get('/doctors', getPublicDoctors);
router.get('/doctors/:doctorId/slots', getDoctorAvailableSlots);
router.use(protect, authorize('patient'));
router.get('/profile', getPatientProfile);
router.put('/profile', validate(patientProfileSchema), updatePatientProfile);
router.post('/appointments', validate(appointmentSchema), bookAppointment);
router.get('/appointments', getPatientAppointments);
router.patch('/appointments/:id/cancel', cancelPatientAppointment);
router.patch('/appointments/:id/reschedule', validate(appointmentRescheduleSchema), reschedulePatientAppointment);
router.patch('/appointments/:id/payment', validate(appointmentPaymentSchema), updatePatientAppointmentPayment);
router.get('/prescriptions', getPatientPrescriptions);

export default router;
