import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Department from '../models/Department.js';
import { AppError } from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.utils.js';
import { isScheduleValid, normalizeSchedule } from '../utils/schedule.utils.js';
import { normalizeAdminType } from '../utils/admin.utils.js';

const buildAuthPayload = async (user) => {
  const baseUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };

  if (user.role === 'admin') {
    return { ...baseUser, adminType: normalizeAdminType(user) };
  }

  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id }).populate('department', 'name');
    return { ...baseUser, doctor };
  }

  if (user.role === 'patient') {
    const patient = await Patient.findOne({ user: user._id });
    return { ...baseUser, patient };
  }

  return baseUser;
};

export const registerPatient = async (req, res) => {
  const { name, email, password, phone, age, gender, bloodGroup, address } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already in use.', StatusCodes.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'patient',
  });

  await Patient.create({
    user: user._id,
    age,
    gender,
    bloodGroup,
    address,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Patient registered successfully.',
  });
};

export const registerDoctor = async (req, res) => {
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
    schedule,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already in use.', StatusCodes.CONFLICT);
  }

  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw new AppError('Department not found.', StatusCodes.NOT_FOUND);
  }

  if (!isScheduleValid(schedule)) {
    throw new AppError('Doctor schedule is invalid.', StatusCodes.BAD_REQUEST);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'doctor',
  });

  await Doctor.create({
    user: user._id,
    department,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio,
    schedule: normalizeSchedule(schedule),
    isApproved: false,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Doctor registration submitted successfully. Please wait for admin approval before logging in.',
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user) {
    throw new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError('Your account is inactive. Contact super admin.', StatusCodes.FORBIDDEN);
  }

  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id });

    if (!doctor) {
      throw new AppError('Doctor profile not found.', StatusCodes.UNAUTHORIZED);
    }

    if (!doctor.isApproved) {
      throw new AppError('Doctor registration is pending admin approval.', StatusCodes.FORBIDDEN);
    }
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      accessToken,
      refreshToken,
      user: await buildAuthPayload(user),
    },
  });
};

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required.', StatusCodes.BAD_REQUEST);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (_error) {
    throw new AppError('Invalid refresh token.', StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Refresh token mismatch.', StatusCodes.UNAUTHORIZED);
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  res.json({ success: true, data: { accessToken } });
};

export const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    data: await buildAuthPayload(req.user),
  });
};

export const logoutUser = async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }

  res.json({ success: true, message: 'Logged out successfully.' });
};
