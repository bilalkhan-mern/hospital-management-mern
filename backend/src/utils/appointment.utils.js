import { StatusCodes } from 'http-status-codes';
import Appointment from '../models/Appointment.js';
import { AppError } from './AppError.js';
import { generateSlotsForDate } from './schedule.utils.js';

export const assertAppointmentCanBeRescheduled = (appointment) => {
  if (appointment.status === 'completed') {
    throw new AppError('Completed appointments cannot be rescheduled.', StatusCodes.BAD_REQUEST);
  }

  if (appointment.status === 'cancelled') {
    throw new AppError('Cancelled appointments cannot be rescheduled.', StatusCodes.BAD_REQUEST);
  }
};

export const getAvailableSlotsForDoctorDate = async ({ doctor, appointmentDate, excludeAppointmentId = null }) => {
  const bookedAppointments = await Appointment.find({
    doctor: doctor._id,
    date: appointmentDate,
    status: { $ne: 'cancelled' },
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
  }).select('timeSlot');

  return generateSlotsForDate({
    schedule: doctor.schedule,
    date: appointmentDate,
    bookedSlots: bookedAppointments.map((item) => item.timeSlot),
  });
};

export const applyReschedule = async ({ appointment, changedByRole, changedByUser, date, timeSlot, reason = '' }) => {
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
