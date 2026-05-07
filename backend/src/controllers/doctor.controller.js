import { StatusCodes } from 'http-status-codes';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Department from '../models/Department.js';
import Report from '../models/Report.js';
import { AppError } from '../utils/AppError.js';

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_SCHEDULE = {
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
};

const STATIC_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

const timePattern = /^([01]\\d|2[0-3]):([0-5]\\d)$/;

const normalizeSchedule = (schedule = {}) => {
  const workingDays = Array.isArray(schedule.workingDays)
    ? schedule.workingDays.map((item) => String(item).toLowerCase()).filter((item) => WEEK_DAYS.includes(item))
    : DEFAULT_SCHEDULE.workingDays;

  return {
    workingDays: workingDays.length ? Array.from(new Set(workingDays)) : DEFAULT_SCHEDULE.workingDays,
    startTime: schedule.startTime || DEFAULT_SCHEDULE.startTime,
    endTime: schedule.endTime || DEFAULT_SCHEDULE.endTime,
    slotDuration: Number(schedule.slotDuration) || DEFAULT_SCHEDULE.slotDuration,
  };
};

const parseMinutes = (value) => {
  if (!timePattern.test(value || '')) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

const isScheduleValid = (schedule) => {
  const normalized = normalizeSchedule(schedule);
  const startMinutes = parseMinutes(normalized.startTime);
  const endMinutes = parseMinutes(normalized.endTime);
  if (startMinutes === null || endMinutes === null) return false;
  if (normalized.slotDuration < 5) return false;
  return endMinutes > startMinutes;
};

const toAmPm = (value) => {
  const minutes = parseMinutes(value);
  if (minutes === null) return value;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;
  return `${String(twelveHour).padStart(2, '0')}:${String(remainder).padStart(2, '0')} ${meridiem}`;
};

const buildScheduleSummary = (schedule) => {
  const normalized = normalizeSchedule(schedule);
  const labels = normalized.workingDays.map((day) => day.slice(0, 3).toUpperCase());
  return `${labels.join(', ')} | ${toAmPm(normalized.startTime)} - ${toAmPm(normalized.endTime)} | ${normalized.slotDuration} min`;
};

const normalizeMedicineItem = (medicine) => {
  if (typeof medicine === 'string') {
    return { name: medicine, dosage: '', frequency: '', days: 1, notes: '' };
  }
  return {
    name: medicine?.name || '',
    dosage: medicine?.dosage || '',
    frequency: medicine?.frequency || '',
    days: medicine?.days || 1,
    notes: medicine?.notes || '',
  };
};

const normalizePrescriptionOutput = (prescription) => ({
  ...prescription.toObject(),
  medicines: Array.isArray(prescription.medicines) ? prescription.medicines.map(normalizeMedicineItem) : [],
  reports: Array.isArray(prescription.reports)
    ? prescription.reports.map((report) => (report?.toObject ? report.toObject() : report))
    : [],
});

const assertAppointmentCanBeRescheduled = (appointment) => {
  if (appointment.status === 'completed') {
    throw new AppError('Completed appointments cannot be rescheduled.', StatusCodes.BAD_REQUEST);
  }
  if (appointment.status === 'cancelled') {
    throw new AppError('Cancelled appointments cannot be rescheduled.', StatusCodes.BAD_REQUEST);
  }
};

const getAvailableSlotsForDoctorDate = async ({ doctor, appointmentDate, excludeAppointmentId = null }) => {
  const bookedAppointments = await Appointment.find({
    doctor: doctor._id,
    date: appointmentDate,
    status: { $ne: 'cancelled' },
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
  }).select('timeSlot');

  const booked = new Set(bookedAppointments.map((item) => item.timeSlot));
  return STATIC_SLOTS.filter((slot) => !booked.has(slot));
};

const applyReschedule = async ({ appointment, changedByRole, changedByUser, date, timeSlot, reason = '' }) => {
  appointment.rescheduleHistory.push({
    changedByRole,
    changedByUser,
    fromDate: appointment.date,
    fromTimeSlot: appointment.timeSlot,
    toDate: date,
    toTimeSlot: timeSlot,
    reason,
  });

  appointment.date = date;
  appointment.timeSlot = timeSlot;
  appointment.status = 'pending';
  await appointment.save();
  return appointment;
};

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
