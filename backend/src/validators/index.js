import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError.js';

const workingDaysField = Joi.array()
  .items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
  .min(1);

const timeField = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);
const scheduleField = Joi.object({
  workingDays: workingDaysField.required(),
  startTime: timeField.required(),
  endTime: timeField.required(),
  slotDuration: Joi.number().min(5).max(180).required(),
});

export const validate = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return next(new AppError(error.details.map((item) => item.message).join(', '), StatusCodes.BAD_REQUEST));
  }

  next();
};

export const authSchemas = {
  register: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().allow(''),
    age: Joi.number().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    bloodGroup: Joi.string().allow(''),
    address: Joi.string().allow(''),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  doctorRegister: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().allow(''),
    department: Joi.string().required(),
    specialization: Joi.string().required(),
    qualification: Joi.string().allow(''),
    experience: Joi.number().min(0).optional(),
    consultationFee: Joi.number().min(0).optional(),
    bio: Joi.string().allow(''),
    schedule: scheduleField.required(),
  }),
};

export const departmentSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
});

export const adminCreateSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow(''),
  adminType: Joi.string().valid('super_admin', 'admin').required(),
});

export const doctorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow(''),
  department: Joi.string().required(),
  specialization: Joi.string().required(),
  qualification: Joi.string().allow(''),
  experience: Joi.number().min(0).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().allow(''),
  schedule: scheduleField.required(),
});

export const doctorUpdateSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow(''),
  department: Joi.string().required(),
  specialization: Joi.string().required(),
  qualification: Joi.string().allow(''),
  experience: Joi.number().min(0).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().allow(''),
  schedule: scheduleField.required(),
});

export const appointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.date().required(),
  timeSlot: Joi.string().required(),
  symptoms: Joi.string().allow(''),
});

export const appointmentRescheduleSchema = Joi.object({
  date: Joi.date().required(),
  timeSlot: Joi.string().required(),
  reason: Joi.string().allow(''),
});

export const appointmentStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'completed', 'cancelled').required(),
  notes: Joi.string().allow(''),
});

export const appointmentPaymentSchema = Joi.object({
  paymentStatus: Joi.string().valid('paid', 'unpaid').required(),
  paymentMethod: Joi.when('paymentStatus', {
    is: 'paid',
    then: Joi.string().valid('cash', 'upi', 'card').required(),
    otherwise: Joi.string().allow('').optional(),
  }),
});

export const prescriptionSchema = Joi.object({
  appointmentId: Joi.string().required(),
  reports: Joi.array().items(Joi.string()).optional(),
  medicines: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().required(),
      frequency: Joi.string().required(),
      days: Joi.number().min(1).required(),
      notes: Joi.string().allow(''),
    })
  ).min(1).required(),
  diagnosis: Joi.string().required(),
  advice: Joi.string().allow(''),
});

export const patientProfileSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow(''),
  age: Joi.number().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  bloodGroup: Joi.string().allow(''),
  address: Joi.string().allow(''),
  medicalHistory: Joi.array().items(Joi.string()).optional(),
});

export const doctorProfileSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow(''),
  specialization: Joi.string().required(),
  qualification: Joi.string().allow(''),
  experience: Joi.number().min(0).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().allow(''),
  schedule: scheduleField.required(),
  department: Joi.string().required(),
});

export const reportUploadSchema = Joi.object({
  appointmentId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  type: Joi.string().valid('lab', 'xray', 'mri', 'prescription', 'other').required(),
  reportDate: Joi.date().required(),
});
