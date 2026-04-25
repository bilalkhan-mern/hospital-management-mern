import { StatusCodes } from 'http-status-codes';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { AppError } from '../utils/AppError.js';
import { buildLastNDaysSeries, buildStatusDistribution } from '../utils/stats.utils.js';

const getSeriesStartDate = (days = 7) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
};

const aggregateAppointmentsPerDay = async (match = {}, days = 7) => {
  const startDate = getSeriesStartDate(days);
  const records = await Appointment.aggregate([
    {
      $match: {
        ...match,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return buildLastNDaysSeries(records, days);
};

const aggregateStatusDistribution = async (match = {}) => {
  const records = await Appointment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return buildStatusDistribution(records);
};

export const getAdminStats = async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admin can access admin statistics.', StatusCodes.FORBIDDEN);
  }

  if (String(process.env.SIMPLE_MODE || '').toLowerCase() === 'true') {
    res.json({
      success: true,
      data: {
        appointmentsPerDay: [
          { date: 'Day-1', count: 2 },
          { date: 'Day-2', count: 1 },
          { date: 'Day-3', count: 3 },
          { date: 'Day-4', count: 2 },
          { date: 'Day-5', count: 4 },
          { date: 'Day-6', count: 1 },
          { date: 'Day-7', count: 2 },
        ],
        appointmentStatus: [
          { name: 'pending', value: 4 },
          { name: 'completed', value: 3 },
          { name: 'cancelled', value: 1 },
        ],
      },
    });
    return;
  }

  const [appointmentsPerDay, appointmentStatus] = await Promise.all([
    aggregateAppointmentsPerDay(),
    aggregateStatusDistribution(),
  ]);

  res.json({
    success: true,
    data: {
      appointmentsPerDay,
      appointmentStatus,
    },
  });
};

export const getDoctorStats = async (req, res) => {
  let doctorId = req.params.id;

  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('_id');
    if (!doctor) {
      throw new AppError('Doctor profile not found.', StatusCodes.NOT_FOUND);
    }

    if (doctorId !== String(doctor._id)) {
      throw new AppError('You can only access your own statistics.', StatusCodes.FORBIDDEN);
    }
  } else if (req.user.role !== 'admin') {
    throw new AppError('You do not have permission to access doctor statistics.', StatusCodes.FORBIDDEN);
  }

  const doctor = await Doctor.findById(doctorId).select('_id');
  if (!doctor) {
    throw new AppError('Doctor not found.', StatusCodes.NOT_FOUND);
  }

  if (String(process.env.SIMPLE_MODE || '').toLowerCase() === 'true') {
    res.json({
      success: true,
      data: {
        appointmentsPerDay: [
          { date: 'Day-1', count: 1 },
          { date: 'Day-2', count: 0 },
          { date: 'Day-3', count: 2 },
          { date: 'Day-4', count: 1 },
          { date: 'Day-5', count: 1 },
          { date: 'Day-6', count: 0 },
          { date: 'Day-7', count: 1 },
        ],
      },
    });
    return;
  }

  const appointmentsPerDay = await aggregateAppointmentsPerDay({ doctor: doctor._id });

  res.json({
    success: true,
    data: {
      appointmentsPerDay,
    },
  });
};

export const getPatientStats = async (req, res) => {
  let patientId = req.params.id;

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id }).select('_id');
    if (!patient) {
      throw new AppError('Patient profile not found.', StatusCodes.NOT_FOUND);
    }

    if (patientId !== String(patient._id)) {
      throw new AppError('You can only access your own statistics.', StatusCodes.FORBIDDEN);
    }
  } else if (req.user.role !== 'admin') {
    throw new AppError('You do not have permission to access patient statistics.', StatusCodes.FORBIDDEN);
  }

  const patient = await Patient.findById(patientId).select('_id');
  if (!patient) {
    throw new AppError('Patient not found.', StatusCodes.NOT_FOUND);
  }

  if (String(process.env.SIMPLE_MODE || '').toLowerCase() === 'true') {
    res.json({
      success: true,
      data: {
        visitHistory: [
          { date: 'Day-1', count: 1 },
          { date: 'Day-2', count: 0 },
          { date: 'Day-3', count: 1 },
          { date: 'Day-4', count: 0 },
          { date: 'Day-5', count: 2 },
          { date: 'Day-6', count: 0 },
          { date: 'Day-7', count: 1 },
        ],
      },
    });
    return;
  }

  const visitHistory = await aggregateAppointmentsPerDay({ patient: patient._id });

  res.json({
    success: true,
    data: {
      visitHistory,
    },
  });
};
