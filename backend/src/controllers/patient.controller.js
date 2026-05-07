import { StatusCodes } from 'http-status-codes';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import { AppError } from '../utils/AppError.js';
import { mockSendEmail } from '../services/email.service.js';

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

const buildScheduleSummary = (schedule) => {
  const workingDays = Array.isArray(schedule?.workingDays) ? schedule.workingDays : [];
  const labels = workingDays.map((day) => String(day).slice(0, 3).toUpperCase());
  const startTime = schedule?.startTime || '';
  const endTime = schedule?.endTime || '';
  const slotDuration = schedule?.slotDuration || 0;
  return `${labels.join(', ')} | ${startTime} - ${endTime} | ${slotDuration} min`;
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
