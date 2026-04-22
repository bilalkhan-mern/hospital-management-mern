import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError.js';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const genders = ['male', 'female', 'other'];
const reportTypes = ['lab', 'xray', 'mri', 'prescription', 'other'];
const appointmentStatuses = ['pending', 'completed', 'cancelled'];
const paymentStatuses = ['paid', 'unpaid'];
const paymentMethods = ['cash', 'upi', 'card'];
const adminTypes = ['super_admin', 'admin'];

const isEmpty = (value) => value === undefined || value === null || value === '';
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || '').trim());
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const isPositiveNumber = (value) => typeof value === 'number' && !Number.isNaN(value) && value >= 0;
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');

const pushError = (errors, message) => {
  if (message) {
    errors.push(message);
  }
};

const requireText = (errors, value, fieldName) => {
  if (isEmpty(value) || typeof value !== 'string' || !value.trim()) {
    pushError(errors, `${fieldName} is required.`);
  }
};

const optionalText = (errors, value, fieldName) => {
  if (!isEmpty(value) && typeof value !== 'string') {
    pushError(errors, `${fieldName} must be a string.`);
  }
};

const requireEmail = (errors, value) => {
  if (isEmpty(value)) {
    pushError(errors, 'Email is required.');
    return;
  }

  if (!isEmail(value)) {
    pushError(errors, 'Email must be valid.');
  }
};

const requirePassword = (errors, value) => {
  if (isEmpty(value)) {
    pushError(errors, 'Password is required.');
    return;
  }

  if (typeof value !== 'string' || value.length < 6) {
    pushError(errors, 'Password must be at least 6 characters.');
  }
};

const optionalNumber = (errors, value, fieldName, min = 0, max = null) => {
  if (isEmpty(value)) {
    return;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    pushError(errors, `${fieldName} must be a number.`);
    return;
  }

  if (value < min) {
    pushError(errors, `${fieldName} must be at least ${min}.`);
  }

  if (max !== null && value > max) {
    pushError(errors, `${fieldName} must be at most ${max}.`);
  }
};

const requireEnum = (errors, value, fieldName, values) => {
  if (isEmpty(value)) {
    pushError(errors, `${fieldName} is required.`);
    return;
  }

  if (!values.includes(value)) {
    pushError(errors, `${fieldName} is invalid.`);
  }
};

const optionalStringArray = (errors, value, fieldName) => {
  if (isEmpty(value)) {
    return;
  }

  if (!isStringArray(value)) {
    pushError(errors, `${fieldName} must be an array of strings.`);
  }
};

const validateSchedule = (schedule) => {
  const errors = [];

  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) {
    pushError(errors, 'Schedule is required.');
    return errors;
  }

  if (!Array.isArray(schedule.workingDays) || schedule.workingDays.length === 0) {
    pushError(errors, 'Schedule working days are required.');
  } else if (schedule.workingDays.some((day) => !days.includes(day))) {
    pushError(errors, 'Schedule working days are invalid.');
  }

  if (!isTime(schedule.startTime)) {
    pushError(errors, 'Schedule start time must be in HH:mm format.');
  }

  if (!isTime(schedule.endTime)) {
    pushError(errors, 'Schedule end time must be in HH:mm format.');
  }

  if (!isPositiveNumber(schedule.slotDuration)) {
    pushError(errors, 'Schedule slot duration must be a positive number.');
  } else if (schedule.slotDuration < 5 || schedule.slotDuration > 180) {
    pushError(errors, 'Schedule slot duration must be between 5 and 180 minutes.');
  }

  return errors;
};

const validateMedicineList = (medicines) => {
  const errors = [];

  if (!Array.isArray(medicines) || medicines.length === 0) {
    pushError(errors, 'At least one medicine is required.');
    return errors;
  }

  medicines.forEach((medicine, index) => {
    if (!medicine || typeof medicine !== 'object') {
      pushError(errors, `Medicine ${index + 1} is invalid.`);
      return;
    }

    requireText(errors, medicine.name, `Medicine ${index + 1} name`);
    requireText(errors, medicine.dosage, `Medicine ${index + 1} dosage`);
    requireText(errors, medicine.frequency, `Medicine ${index + 1} frequency`);

    if (!Number.isInteger(medicine.days) || medicine.days < 1) {
      pushError(errors, `Medicine ${index + 1} days must be at least 1.`);
    }

    optionalText(errors, medicine.notes, `Medicine ${index + 1} notes`);
  });

  return errors;
};

const createValidator = (validationFn) => (body) => {
  const errors = validationFn(body || {});
  return errors.filter(Boolean);
};

export const validate = (schema) => (req, _res, next) => {
  const errors = typeof schema === 'function' ? schema(req.body) : [];

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), StatusCodes.BAD_REQUEST));
  }

  next();
};

export const authSchemas = {
  register: createValidator((body) => {
    const errors = [];
    requireText(errors, body.name, 'Name');
    requireEmail(errors, body.email);
    requirePassword(errors, body.password);
    optionalText(errors, body.phone, 'Phone');
    optionalNumber(errors, body.age, 'Age');
    if (!isEmpty(body.gender)) {
      requireEnum(errors, body.gender, 'Gender', genders);
    }
    optionalText(errors, body.bloodGroup, 'Blood group');
    optionalText(errors, body.address, 'Address');
    return errors;
  }),
  login: createValidator((body) => {
    const errors = [];
    requireEmail(errors, body.email);
    requireText(errors, body.password, 'Password');
    return errors;
  }),
  doctorRegister: createValidator((body) => {
    const errors = [];
    requireText(errors, body.name, 'Name');
    requireEmail(errors, body.email);
    requirePassword(errors, body.password);
    optionalText(errors, body.phone, 'Phone');
    requireText(errors, body.department, 'Department');
    requireText(errors, body.specialization, 'Specialization');
    optionalText(errors, body.qualification, 'Qualification');
    optionalNumber(errors, body.experience, 'Experience');
    optionalNumber(errors, body.consultationFee, 'Consultation fee');
    optionalText(errors, body.bio, 'Bio');
    return errors.concat(validateSchedule(body.schedule));
  }),
};

export const departmentSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.name, 'Name');
  optionalText(errors, body.description, 'Description');
  return errors;
});

export const adminCreateSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.name, 'Name');
  requireEmail(errors, body.email);
  requirePassword(errors, body.password);
  optionalText(errors, body.phone, 'Phone');
  requireEnum(errors, body.adminType, 'Admin type', adminTypes);
  return errors;
});

export const doctorSchema = createValidator((body) => authSchemas.doctorRegister(body));

export const doctorUpdateSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.name, 'Name');
  optionalText(errors, body.phone, 'Phone');
  requireText(errors, body.department, 'Department');
  requireText(errors, body.specialization, 'Specialization');
  optionalText(errors, body.qualification, 'Qualification');
  optionalNumber(errors, body.experience, 'Experience');
  optionalNumber(errors, body.consultationFee, 'Consultation fee');
  optionalText(errors, body.bio, 'Bio');
  return errors.concat(validateSchedule(body.schedule));
});

export const appointmentSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.doctorId, 'Doctor ID');
  if (!isValidDate(body.date)) {
    pushError(errors, 'Date is required and must be valid.');
  }
  requireText(errors, body.timeSlot, 'Time slot');
  optionalText(errors, body.symptoms, 'Symptoms');
  return errors;
});

export const appointmentRescheduleSchema = createValidator((body) => {
  const errors = [];
  if (!isValidDate(body.date)) {
    pushError(errors, 'Date is required and must be valid.');
  }
  requireText(errors, body.timeSlot, 'Time slot');
  optionalText(errors, body.reason, 'Reason');
  return errors;
});

export const appointmentStatusSchema = createValidator((body) => {
  const errors = [];
  requireEnum(errors, body.status, 'Status', appointmentStatuses);
  optionalText(errors, body.notes, 'Notes');
  return errors;
});

export const appointmentPaymentSchema = createValidator((body) => {
  const errors = [];
  requireEnum(errors, body.paymentStatus, 'Payment status', paymentStatuses);

  if (body.paymentStatus === 'paid') {
    requireEnum(errors, body.paymentMethod, 'Payment method', paymentMethods);
  } else {
    optionalText(errors, body.paymentMethod, 'Payment method');
  }

  return errors;
});

export const prescriptionSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.appointmentId, 'Appointment ID');
  if (!isEmpty(body.reports) && !Array.isArray(body.reports)) {
    pushError(errors, 'Reports must be an array.');
  }
  requireText(errors, body.diagnosis, 'Diagnosis');
  optionalText(errors, body.advice, 'Advice');
  return errors.concat(validateMedicineList(body.medicines));
});

export const patientProfileSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.name, 'Name');
  optionalText(errors, body.phone, 'Phone');
  optionalNumber(errors, body.age, 'Age');
  if (!isEmpty(body.gender)) {
    requireEnum(errors, body.gender, 'Gender', genders);
  }
  optionalText(errors, body.bloodGroup, 'Blood group');
  optionalText(errors, body.address, 'Address');
  optionalStringArray(errors, body.medicalHistory, 'Medical history');
  return errors;
});

export const doctorProfileSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.name, 'Name');
  optionalText(errors, body.phone, 'Phone');
  requireText(errors, body.specialization, 'Specialization');
  optionalText(errors, body.qualification, 'Qualification');
  optionalNumber(errors, body.experience, 'Experience');
  optionalNumber(errors, body.consultationFee, 'Consultation fee');
  optionalText(errors, body.bio, 'Bio');
  requireText(errors, body.department, 'Department');
  return errors.concat(validateSchedule(body.schedule));
});

export const reportUploadSchema = createValidator((body) => {
  const errors = [];
  requireText(errors, body.appointmentId, 'Appointment ID');
  requireText(errors, body.title, 'Title');
  optionalText(errors, body.description, 'Description');
  requireEnum(errors, body.type, 'Type', reportTypes);
  if (!isValidDate(body.reportDate)) {
    pushError(errors, 'Report date is required and must be valid.');
  }
  return errors;
});
