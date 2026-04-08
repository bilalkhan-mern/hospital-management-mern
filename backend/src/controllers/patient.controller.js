import { StatusCodes } from 'http-status-codes';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import { createAuditLog } from '../utils/audit.utils.js';
import { AppError } from '../utils/AppError.js';
import { mockSendEmail } from '../services/email.service.js';
import { buildScheduleSummary, isScheduleValid } from '../utils/schedule.utils.js';
import { applyReschedule, assertAppointmentCanBeRescheduled, getAvailableSlotsForDoctorDate } from '../utils/appointment.utils.js';
import { normalizePrescriptionOutput } from '../utils/prescription.utils.js';

export const getPatientProfile = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate('user', 'name email phone role');

  if (!patient) {
    throw new AppError('Patient profile not found.', StatusCodes.NOT_FOUND);
  }

  res.json({ success: true, data: patient });
};

export const updatePatientProfile = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate('user');
  if (!patient) {
    throw new AppError('Patient profile not found.', StatusCodes.NOT_FOUND);
  }

  patient.user.name = req.body.name;
  patient.user.phone = req.body.phone;
  await patient.user.save();

  Object.assign(patient, {
    age: req.body.age,
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    address: req.body.address,
    medicalHistory: req.body.medicalHistory,
  });

  await patient.save();

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'patient.profile.updated',
    entityType: 'patient',
    entityId: patient._id,
    message: 'Patient updated profile details.',
    metadata: {
      age: patient.age || null,
      gender: patient.gender || null,
    },
  });

  res.json({ success: true, message: 'Patient profile updated successfully.', data: patient });
};

export const getPublicDoctors = async (req, res) => {
  const { search = '', department = '', page = 1, limit = 6 } = req.query;
  const query = { isApproved: true };

  if (department) {
    query.department = department;
  }

  const doctors = await Doctor.find(query)
    .populate('user', 'name email phone')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  const filtered = doctors.filter((doctor) => {
    const haystack = `${doctor.user.name} ${doctor.specialization} ${doctor.department?.name || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const paginated = filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  res.json({
    success: true,
    data: {
      items: paginated.map((doctor) => ({
        ...doctor.toObject(),
        scheduleSummary: buildScheduleSummary(doctor.schedule),
      })),
      pagination: {
        total: filtered.length,
        page: pageNumber,
        pages: Math.ceil(filtered.length / pageSize),
      },
    },
  });
};

export const getDoctorAvailableSlots = async (req, res) => {
  const { date } = req.query;
  const doctor = await Doctor.findById(req.params.doctorId);

  if (!doctor || !doctor.isApproved) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  if (!date) {
    throw new AppError('Date is required to fetch available slots.', StatusCodes.BAD_REQUEST);
  }

  const appointmentDate = new Date(date);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new AppError('Invalid appointment date.', StatusCodes.BAD_REQUEST);
  }

  if (!isScheduleValid(doctor.schedule)) {
    throw new AppError('Doctor schedule is not configured properly.', StatusCodes.BAD_REQUEST);
  }

  const slots = await getAvailableSlotsForDoctorDate({
    doctor,
    appointmentDate,
  });

  res.json({
    success: true,
    data: {
      doctorId: doctor._id,
      date: appointmentDate,
      slots,
      scheduleSummary: buildScheduleSummary(doctor.schedule),
    },
  });
};

export const bookAppointment = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate('user');
  const doctor = await Doctor.findById(req.body.doctorId).populate('user');

  if (!patient) {
    throw new AppError('Patient profile not found.', StatusCodes.NOT_FOUND);
  }

  if (!doctor) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  if (!doctor.isApproved) {
    throw new AppError('Doctor is not available for booking yet.', StatusCodes.BAD_REQUEST);
  }

  const appointmentDate = new Date(req.body.date);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new AppError('Invalid appointment date.', StatusCodes.BAD_REQUEST);
  }

  const availableSlots = await getAvailableSlotsForDoctorDate({
    doctor,
    appointmentDate,
  });

  if (!availableSlots.includes(req.body.timeSlot)) {
    throw new AppError('Selected time slot is not available for this doctor on the chosen date.', StatusCodes.BAD_REQUEST);
  }

  const existingAppointment = await Appointment.findOne({
    doctor: doctor._id,
    date: appointmentDate,
    timeSlot: req.body.timeSlot,
    status: { $ne: 'cancelled' },
  });

  if (existingAppointment) {
    throw new AppError('Selected time slot is already booked.', StatusCodes.CONFLICT);
  }

  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    date: appointmentDate,
    timeSlot: req.body.timeSlot,
    symptoms: req.body.symptoms,
    amount: doctor.consultationFee || 0,
    paymentStatus: 'unpaid',
  });

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'appointment.booked',
    entityType: 'appointment',
    entityId: appointment._id,
    message: `Patient booked an appointment with Dr. ${doctor.user?.name || 'doctor'}.`,
    metadata: {
      doctorId: doctor._id,
      patientId: patient._id,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      amount: appointment.amount,
    },
  });

  await mockSendEmail({
    to: patient.user.email,
    subject: 'Appointment Confirmation',
    message: `Your appointment with Dr. ${doctor.user.name} is booked for ${req.body.timeSlot}.`,
  });

  res.status(StatusCodes.CREATED).json({ success: true, message: 'Appointment booked successfully.', data: appointment });
};

export const getPatientAppointments = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const appointments = await Appointment.find({ patient: patient._id })
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'department', select: 'name' },
      ],
    })
    .sort({ date: -1, createdAt: -1 });

  res.json({ success: true, data: appointments });
};

export const updatePatientAppointmentPayment = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: patient._id });

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  if (appointment.status === 'cancelled') {
    throw new AppError('Cancelled appointments cannot be paid.', StatusCodes.BAD_REQUEST);
  }

  appointment.paymentStatus = req.body.paymentStatus;
  appointment.paymentMethod = req.body.paymentStatus === 'paid' ? req.body.paymentMethod : '';
  appointment.paidAt = req.body.paymentStatus === 'paid' ? new Date() : undefined;
  await appointment.save();

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'appointment.payment.updated',
    entityType: 'appointment',
    entityId: appointment._id,
    message: `Patient marked appointment payment as ${appointment.paymentStatus}.`,
    metadata: {
      paymentStatus: appointment.paymentStatus,
      paymentMethod: appointment.paymentMethod || null,
      amount: appointment.amount,
    },
  });

  res.json({ success: true, message: 'Payment updated successfully.', data: appointment });
};

export const cancelPatientAppointment = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: patient._id });

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  if (appointment.status === 'completed') {
    throw new AppError('Completed appointments cannot be cancelled.', StatusCodes.BAD_REQUEST);
  }

  appointment.status = 'cancelled';
  await appointment.save();

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'appointment.cancelled',
    entityType: 'appointment',
    entityId: appointment._id,
    message: 'Patient cancelled an appointment.',
    metadata: {
      previousStatus: 'pending',
    },
  });

  res.json({ success: true, message: 'Appointment cancelled successfully.', data: appointment });
};

export const reschedulePatientAppointment = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: patient._id }).populate('doctor');

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  assertAppointmentCanBeRescheduled(appointment);

  const appointmentDate = new Date(req.body.date);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new AppError('Invalid appointment date.', StatusCodes.BAD_REQUEST);
  }

  const availableSlots = await getAvailableSlotsForDoctorDate({
    doctor: appointment.doctor,
    appointmentDate,
    excludeAppointmentId: appointment._id,
  });

  if (!availableSlots.includes(req.body.timeSlot)) {
    throw new AppError('Selected reschedule slot is not available.', StatusCodes.BAD_REQUEST);
  }

  const previousDate = appointment.date;
  const previousTimeSlot = appointment.timeSlot;
  const updated = await applyReschedule({
    appointment,
    changedByRole: 'patient',
    changedByUser: req.user._id,
    date: appointmentDate,
    timeSlot: req.body.timeSlot,
    reason: req.body.reason,
  });

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'appointment.rescheduled',
    entityType: 'appointment',
    entityId: appointment._id,
    message: 'Patient rescheduled an appointment.',
    metadata: {
      oldDate: previousDate,
      oldTimeSlot: previousTimeSlot,
      newDate: updated.date,
      newTimeSlot: updated.timeSlot,
      reason: req.body.reason || '',
    },
  });

  res.json({ success: true, message: 'Appointment rescheduled successfully.', data: updated });
};

export const getPatientPrescriptions = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  const prescriptions = await Prescription.find({ patient: patient._id })
    .populate({ path: 'doctor', select: 'specialization user', populate: { path: 'user', select: 'name email' } })
    .populate('appointment', 'date timeSlot status')
    .populate({ path: 'reports', match: { isDeleted: false }, select: 'title type reportDate fileType uploadedBy createdAt appointmentId doctorId patientId' })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: prescriptions.map(normalizePrescriptionOutput) });
};
