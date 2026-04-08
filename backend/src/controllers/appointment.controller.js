import { StatusCodes } from 'http-status-codes';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { AppError } from '../utils/AppError.js';

export const getAppointmentsByRole = async (req, res) => {
  const query = {};

  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    query.doctor = doctor._id;
  }

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    query.patient = patient._id;
  }

  const appointments = await Appointment.find(query)
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

export const getAppointmentById = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'department', select: 'name' },
      ],
    });

  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  res.json({ success: true, data: appointment });
};
