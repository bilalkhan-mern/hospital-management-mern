import { StatusCodes } from 'http-status-codes';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Department from '../models/Department.js';
import Report from '../models/Report.js';
import { AppError } from '../utils/AppError.js';
import { buildScheduleSummary, isScheduleValid, normalizeSchedule } from '../utils/schedule.utils.js';
import { applyReschedule, assertAppointmentCanBeRescheduled, getAvailableSlotsForDoctorDate } from '../utils/appointment.utils.js';
import { normalizePrescriptionOutput } from '../utils/prescription.utils.js';

export const getDoctorProfile = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
    .populate('user', 'name email phone role')
    .populate('department', 'name description');

  if (!doctor) {
    throw new AppError('Doctor profile not found.', StatusCodes.NOT_FOUND);
  }

  res.json({
    success: true,
    data: {
      ...doctor.toObject(),
      scheduleSummary: buildScheduleSummary(doctor.schedule),
    },
  });
};

export const updateDoctorProfile = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user');
  if (!doctor) {
    throw new AppError('Doctor profile not found.', StatusCodes.NOT_FOUND);
  }

  const department = await Department.findById(req.body.department);
  if (!department) {
    throw new AppError('Department not found.', StatusCodes.NOT_FOUND);
  }

  // Simple-only build: schedule validation is relaxed (slots are static).

  doctor.user.name = req.body.name;
  doctor.user.phone = req.body.phone;
  await doctor.user.save();

  Object.assign(doctor, {
    department: req.body.department,
    specialization: req.body.specialization,
    qualification: req.body.qualification,
    experience: req.body.experience,
    consultationFee: req.body.consultationFee,
    bio: req.body.bio,
    schedule: normalizeSchedule(req.body.schedule),
  });

  await doctor.save();
res.json({
    success: true,
    message: 'Doctor profile updated successfully.',
    data: {
      ...doctor.toObject(),
      scheduleSummary: buildScheduleSummary(doctor.schedule),
    },
  });
};

export const getDoctorAppointments = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .sort({ date: -1 });

  const appointmentIds = appointments.map((item) => item._id);
  const [prescriptions, reports] = await Promise.all([
    Prescription.find({
      appointment: { $in: appointmentIds },
    }).select('appointment'),
    Report.find({
      appointmentId: { $in: appointmentIds },
      isDeleted: false,
    }).select('appointmentId uploadedBy'),
  ]);

  const prescribedAppointmentIds = new Set(prescriptions.map((item) => String(item.appointment)));
  const doctorReportedAppointmentIds = new Set(
    reports.filter((item) => item.uploadedBy === 'doctor').map((item) => String(item.appointmentId))
  );
  const reportCountMap = reports.reduce((accumulator, item) => {
    const key = String(item.appointmentId);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const enrichedAppointments = appointments.map((appointment) => ({
    ...appointment.toObject(),
    hasPrescription: prescribedAppointmentIds.has(String(appointment._id)),
    hasDoctorReport: doctorReportedAppointmentIds.has(String(appointment._id)),
    reportCount: reportCountMap[String(appointment._id)] || 0,
  }));

  res.json({ success: true, data: enrichedAppointments });
};

export const updateAppointmentStatus = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, doctor: doctor._id });

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  if (appointment.status === 'completed') {
    throw new AppError('Completed appointments are locked and cannot be modified.', StatusCodes.BAD_REQUEST);
  }

  appointment.status = req.body.status;
  appointment.notes = req.body.notes;
  await appointment.save();
res.json({ success: true, message: 'Appointment status updated.', data: appointment });
};

export const rescheduleDoctorAppointment = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, doctor: doctor._id });

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  assertAppointmentCanBeRescheduled(appointment);

  const appointmentDate = new Date(req.body.date);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new AppError('Invalid appointment date.', StatusCodes.BAD_REQUEST);
  }

  const availableSlots = await getAvailableSlotsForDoctorDate({
    doctor,
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
    changedByRole: 'doctor',
    changedByUser: req.user._id,
    date: appointmentDate,
    timeSlot: req.body.timeSlot,
    reason: req.body.reason,
  });
res.json({ success: true, message: 'Appointment rescheduled successfully.', data: updated });
};

export const addPrescription = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.body.appointmentId, doctor: doctor._id });

  if (!appointment) {
    throw new AppError('Appointment not found for this doctor.', StatusCodes.NOT_FOUND);
  }

  if (appointment.status !== 'completed') {
    throw new AppError('Prescription can only be added after the appointment is completed.', StatusCodes.BAD_REQUEST);
  }

  const existing = await Prescription.findOne({ appointment: appointment._id });
  if (existing) {
    throw new AppError('Prescription already exists for this appointment.', StatusCodes.CONFLICT);
  }

  const requestedReportIds = Array.isArray(req.body.reports) ? req.body.reports : [];
  const relatedReports = requestedReportIds.length
    ? await Report.find({
      _id: { $in: requestedReportIds },
      appointmentId: appointment._id,
      isDeleted: false,
    }).select('_id')
    : [];

  if (requestedReportIds.length && relatedReports.length !== requestedReportIds.length) {
    throw new AppError('Only active reports from the same appointment can be linked to this prescription.', StatusCodes.BAD_REQUEST);
  }

  const prescription = await Prescription.create({
    appointment: appointment._id,
    doctor: doctor._id,
    patient: appointment.patient,
    medicines: req.body.medicines,
    diagnosis: req.body.diagnosis,
    advice: req.body.advice,
    reports: relatedReports.map((report) => report._id),
  });
res.status(StatusCodes.CREATED).json({ success: true, message: 'Prescription added successfully.', data: prescription });
};

export const getPatientHistory = async (req, res) => {
  const patient =
    (await Patient.findById(req.params.patientId).populate('user', 'name email phone')) ||
    (await Patient.findOne({ user: req.params.patientId }).populate('user', 'name email phone'));

  if (!patient) {
    throw new AppError('Patient not found.', StatusCodes.NOT_FOUND);
  }

  const [appointments, prescriptions] = await Promise.all([
    Appointment.find({ patient: patient._id })
      .populate({ path: 'doctor', select: 'specialization', populate: { path: 'user', select: 'name' } })
      .sort({ date: -1 }),
    Prescription.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'reports', match: { isDeleted: false }, select: 'title type reportDate fileType uploadedBy createdAt appointmentId doctorId patientId' })
      .sort({ createdAt: -1 }),
  ]);

  res.json({
    success: true,
    data: {
      patient,
      appointments,
      prescriptions: prescriptions.map(normalizePrescriptionOutput),
    },
  });
};
