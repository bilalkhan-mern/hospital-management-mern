import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Department from '../models/Department.js';
import { AppError } from '../utils/AppError.js';
import { buildScheduleSummary, isScheduleValid, normalizeSchedule } from '../utils/schedule.utils.js';
import { normalizeAdminType } from '../utils/admin.utils.js';

export const getAdminDashboard = async (_req, res) => {
  const [patients, doctors, appointments, departments, pendingDoctors, paidAppointments, unpaidAppointments] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Appointment.countDocuments(),
    Department.countDocuments(),
    Doctor.countDocuments({ isApproved: false }),
    Appointment.countDocuments({ paymentStatus: 'paid' }),
    Appointment.countDocuments({ paymentStatus: 'unpaid' }),
  ]);

  const recentAppointments = await Appointment.find()
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
    .populate({ path: 'doctor', select: 'specialization', populate: { path: 'user', select: 'name email' } })
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({
    success: true,
    data: {
      stats: { patients, doctors, appointments, departments, pendingDoctors, paidAppointments, unpaidAppointments },
      recentAppointments,
    },
  });
};

export const createDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    department,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio,
    availableSlots,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Doctor email already exists.', StatusCodes.CONFLICT);
  }

  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw new AppError('Department not found.', StatusCodes.NOT_FOUND);
  }

  // Simple-only build: schedule validation is relaxed (slots are static).

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'doctor',
  });

  const doctor = await Doctor.create({
    user: user._id,
    department,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio,
    schedule: normalizeSchedule(req.body.schedule),
    image: req.file ? `/uploads/${req.file.filename}` : undefined,
    isApproved: true,
  });
res.status(StatusCodes.CREATED).json({ success: true, data: doctor, message: 'Doctor created successfully.' });
};

export const updateDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user');
  if (!doctor) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  // Simple-only build: schedule validation is relaxed (slots are static).

  const departmentExists = await Department.findById(req.body.department);
  if (!departmentExists) {
    throw new AppError('Department not found.', StatusCodes.NOT_FOUND);
  }

  const {
    name,
    phone,
    department,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio,
    availableSlots,
  } = req.body;

  doctor.user.name = name;
  doctor.user.phone = phone;
  await doctor.user.save();

  Object.assign(doctor, {
    department,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio,
    schedule: normalizeSchedule(req.body.schedule),
  });

  await doctor.save();
res.json({ success: true, message: 'Doctor updated successfully.', data: doctor });
};

export const deleteDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  await Appointment.deleteMany({ doctor: doctor._id });
  await Doctor.findByIdAndDelete(req.params.id);
  await User.findByIdAndDelete(doctor.user);
res.json({ success: true, message: 'Doctor deleted successfully.' });
};

export const getDoctors = async (_req, res) => {
  const doctors = await Doctor.find()
    .populate('user', 'name email phone')
    .populate('department', 'name description')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: doctors.map((doctor) => ({
      ...doctor.toObject(),
      scheduleSummary: buildScheduleSummary(doctor.schedule),
    })),
  });
};

export const getPendingDoctors = async (_req, res) => {
  const pendingDoctors = await Doctor.find({ isApproved: false })
    .populate('user', 'name email phone createdAt')
    .populate('department', 'name description')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: pendingDoctors.map((doctor) => ({
      ...doctor.toObject(),
      scheduleSummary: buildScheduleSummary(doctor.schedule),
    })),
  });
};

export const approveDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user');
  if (!doctor) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  doctor.isApproved = true;
  await doctor.save();
res.json({ success: true, message: 'Doctor approved successfully.', data: doctor });
};

export const rejectDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  await Doctor.findByIdAndDelete(req.params.id);
  await User.findByIdAndDelete(doctor.user);
res.json({ success: true, message: 'Doctor registration rejected and removed.' });
};

export const getPatients = async (_req, res) => {
  const patients = await Patient.find().populate('user', 'name email phone').sort({ createdAt: -1 });
  res.json({ success: true, data: patients });
};

export const getAllAppointments = async (_req, res) => {
  const appointments = await Appointment.find()
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
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

export const getAdmins = async (_req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: admins.map((admin) => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      adminType: normalizeAdminType(admin),
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    })),
  });
};

export const getAuditLogs = async (req, res) => {
  // Fresher-friendly build: audit logs are not part of the core workflow.
  res.json({ success: true, data: [] });
};

export const createAdminUser = async (req, res) => {
  const { name, email, password, phone, adminType } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Admin email already exists.', StatusCodes.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'admin',
    adminType,
    isActive: true,
  });
res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Admin created successfully.',
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      adminType: normalizeAdminType(admin),
      isActive: admin.isActive,
    },
  });
};

export const deactivateAdminUser = async (req, res) => {
  const targetAdmin = await User.findOne({ _id: req.params.id, role: 'admin' });

  if (!targetAdmin) {
    throw new AppError('Admin not found.', StatusCodes.NOT_FOUND);
  }

  if (String(targetAdmin._id) === String(req.user._id)) {
    throw new AppError('You cannot deactivate your own account.', StatusCodes.BAD_REQUEST);
  }

  if (normalizeAdminType(targetAdmin) === 'super_admin') {
    const activeSuperAdmins = await User.countDocuments({ role: 'admin', adminType: 'super_admin', isActive: true });
    if (activeSuperAdmins <= 1 && targetAdmin.isActive) {
      throw new AppError('You cannot deactivate the last active super admin.', StatusCodes.BAD_REQUEST);
    }
  }

  targetAdmin.isActive = false;
  await targetAdmin.save();
res.json({ success: true, message: 'Admin deactivated successfully.' });
};

export const activateAdminUser = async (req, res) => {
  const targetAdmin = await User.findOne({ _id: req.params.id, role: 'admin' });

  if (!targetAdmin) {
    throw new AppError('Admin not found.', StatusCodes.NOT_FOUND);
  }

  targetAdmin.isActive = true;
  await targetAdmin.save();
res.json({ success: true, message: 'Admin activated successfully.' });
};

export const deleteAdminUser = async (req, res) => {
  const targetAdmin = await User.findOne({ _id: req.params.id, role: 'admin' });

  if (!targetAdmin) {
    throw new AppError('Admin not found.', StatusCodes.NOT_FOUND);
  }

  if (String(targetAdmin._id) === String(req.user._id)) {
    throw new AppError('You cannot delete your own account.', StatusCodes.BAD_REQUEST);
  }

  if (normalizeAdminType(targetAdmin) === 'super_admin') {
    const totalSuperAdmins = await User.countDocuments({ role: 'admin', adminType: 'super_admin' });
    if (totalSuperAdmins <= 1) {
      throw new AppError('You cannot delete the last super admin.', StatusCodes.BAD_REQUEST);
    }
  }

  await User.findByIdAndDelete(targetAdmin._id);
res.json({ success: true, message: 'Admin removed successfully.' });
};

export const updateAppointmentPayment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  appointment.paymentStatus = req.body.paymentStatus;
  appointment.paymentMethod = req.body.paymentStatus === 'paid' ? req.body.paymentMethod : '';
  appointment.paidAt = req.body.paymentStatus === 'paid' ? new Date() : undefined;
  await appointment.save();
res.json({ success: true, message: 'Appointment payment updated successfully.', data: appointment });
};
