import { StatusCodes } from 'http-status-codes';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Report from '../models/Report.js';
import Prescription from '../models/Prescription.js';
import { createAuditLog } from '../utils/audit.utils.js';
import { AppError } from '../utils/AppError.js';
import {
  getLocalReportPath,
  getReportAccessUrl,
  getReportFileType,
  persistLocalReportFile,
  uploadBufferToCloudinary,
} from '../utils/report.utils.js';
import fs from 'fs/promises';

const reportPopulate = [
  { path: 'patientId', populate: { path: 'user', select: 'name email phone' } },
  { path: 'doctorId', populate: { path: 'user', select: 'name email phone' } },
  {
    path: 'appointmentId',
    select: 'date timeSlot status amount paymentStatus paymentMethod',
    populate: [
      { path: 'patient', populate: { path: 'user', select: 'name email phone' } },
      { path: 'doctor', populate: { path: 'user', select: 'name email phone' } },
    ],
  },
];

const activeReportFilter = { isDeleted: false };

const populateReportQuery = (query) => {
  let nextQuery = query;
  reportPopulate.forEach((populateConfig) => {
    nextQuery = nextQuery.populate(populateConfig);
  });
  return nextQuery;
};

const sanitizeFilename = (value = 'report') => value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'report';

const ensureUserCanAccessReport = async (reportId, user) => {
  const report = await populateReportQuery(Report.findById(reportId));
  if (!report) {
    throw new AppError('Report not found.', StatusCodes.NOT_FOUND);
  }

  if (report.isDeleted && user.role !== 'admin') {
    throw new AppError('This report is no longer available.', StatusCodes.NOT_FOUND);
  }

  if (user.role === 'admin') {
    return report;
  }

  if (user.role === 'patient') {
    const patient = await Patient.findOne({ user: user._id });
    if (!patient || String(report.patientId?._id || report.patientId) !== String(patient._id)) {
      throw new AppError('You can only access your own reports.', StatusCodes.FORBIDDEN);
    }

    return report;
  }

  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id });
    if (!doctor || String(report.doctorId?._id || report.doctorId) !== String(doctor._id)) {
      throw new AppError('You can only access reports related to your appointments.', StatusCodes.FORBIDDEN);
    }

    return report;
  }

  throw new AppError('You do not have permission to access this report.', StatusCodes.FORBIDDEN);
};

const ensurePatientOwnsAppointment = async (appointmentId, userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    throw new AppError('Patient profile not found.', StatusCodes.NOT_FOUND);
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, patient: patient._id })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } });

  if (!appointment) {
    throw new AppError('Appointment not found for this patient.', StatusCodes.NOT_FOUND);
  }

  return { patient, appointment };
};

const ensureDoctorOwnsAppointment = async (appointmentId, userId) => {
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) {
    throw new AppError('Doctor profile not found.', StatusCodes.NOT_FOUND);
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctor._id })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } });

  if (!appointment) {
    throw new AppError('Appointment not found for this doctor.', StatusCodes.NOT_FOUND);
  }

  return { doctor, appointment };
};

export const uploadReport = async (req, res) => {
  if (!req.file) {
    throw new AppError('Report file is required.', StatusCodes.BAD_REQUEST);
  }

  const { appointmentId, title, description = '', type, reportDate } = req.body;

  if (!appointmentId || !title || !type || !reportDate) {
    throw new AppError('Appointment, title, report type, and report date are required.', StatusCodes.BAD_REQUEST);
  }

  const normalizedReportDate = new Date(reportDate);
  if (Number.isNaN(normalizedReportDate.getTime())) {
    throw new AppError('Report date is invalid.', StatusCodes.BAD_REQUEST);
  }

  let patient;
  let doctor = null;
  let appointment;
  let uploadedBy;

  if (req.user.role === 'patient') {
    ({ patient, appointment } = await ensurePatientOwnsAppointment(appointmentId, req.user._id));
    doctor = appointment.doctor || null;
    uploadedBy = 'patient';
  } else if (req.user.role === 'doctor') {
    ({ doctor, appointment } = await ensureDoctorOwnsAppointment(appointmentId, req.user._id));
    patient = await Patient.findById(appointment.patient);
    if (!patient) {
      throw new AppError('Patient profile not found for this appointment.', StatusCodes.NOT_FOUND);
    }

    if (appointment.status !== 'completed') {
      throw new AppError('Doctors can upload reports only after consultation is completed.', StatusCodes.BAD_REQUEST);
    }

    const existingDoctorReport = await Report.findOne({ appointmentId: appointment._id, uploadedBy: 'doctor' }).select('_id');
    if (existingDoctorReport) {
      throw new AppError('A doctor report has already been uploaded for this appointment.', StatusCodes.CONFLICT);
    }

    uploadedBy = 'doctor';
  } else {
    throw new AppError('Only patient or doctor can upload reports.', StatusCodes.FORBIDDEN);
  }

  const uploadResult = await uploadBufferToCloudinary(req.file);
  const fileType = getReportFileType(req.file.mimetype);
  const localFileName = await persistLocalReportFile(req.file);

  const report = await Report.create({
    patientId: patient._id,
    doctorId: doctor?._id || appointment.doctor || null,
    appointmentId: appointment._id,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    mimeType: req.file.mimetype,
    originalName: req.file.originalname,
    localFileName,
    type,
    reportDate: normalizedReportDate,
    fileType,
    title,
    description,
    uploadedBy,
  });

  await Prescription.updateOne(
    { appointment: appointment._id },
    { $addToSet: { reports: report._id } }
  );

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'report.uploaded',
    entityType: 'report',
    entityId: report._id,
    message: `${req.user.role === 'doctor' ? 'Doctor' : 'Patient'} uploaded ${type} report "${title}".`,
    metadata: {
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: doctor?._id || appointment.doctor || null,
      reportType: type,
      uploadedBy,
    },
  });

  const populatedReport = await populateReportQuery(Report.findById(report._id));

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Report uploaded successfully.',
    data: populatedReport,
  });
};

export const getReportsByPatient = async (req, res) => {
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient || String(patient._id) !== req.params.id) {
      throw new AppError('You can only access your own reports.', StatusCodes.FORBIDDEN);
    }
  } else if (req.user.role !== 'admin') {
    throw new AppError('You do not have permission to access patient reports.', StatusCodes.FORBIDDEN);
  }

  const filters = { patientId: req.params.id, ...activeReportFilter };
  const reports = await populateReportQuery(Report.find(filters).sort({ reportDate: -1, createdAt: -1 }));
  res.json({ success: true, data: reports });
};

export const getReportsByAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new AppError('Appointment not found.', StatusCodes.NOT_FOUND);
  }

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient || String(appointment.patient) !== String(patient._id)) {
      throw new AppError('You can only access reports for your own appointments.', StatusCodes.FORBIDDEN);
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || String(appointment.doctor) !== String(doctor._id)) {
      throw new AppError('You can only access reports for your assigned appointments.', StatusCodes.FORBIDDEN);
    }
  } else if (req.user.role !== 'admin') {
    throw new AppError('You do not have permission to access appointment reports.', StatusCodes.FORBIDDEN);
  }

  const reports = await populateReportQuery(Report.find({ appointmentId: appointment._id, ...activeReportFilter }).sort({ reportDate: -1, createdAt: -1 }));
  res.json({ success: true, data: reports });
};

export const getAllReports = async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admin can access all reports.', StatusCodes.FORBIDDEN);
  }

  const includeDeleted = req.query.includeDeleted === 'true';
  const reports = await populateReportQuery(
    Report.find(includeDeleted ? {} : activeReportFilter).sort({ createdAt: -1 })
  );
  res.json({ success: true, data: reports });
};

export const streamReportFile = async (req, res) => {
  const report = await ensureUserCanAccessReport(req.params.id, req.user);
  const shouldDownload = req.query.download === 'true';
  const filename = `${sanitizeFilename(report.title)}.${report.fileType === 'pdf' ? 'pdf' : 'file'}`;
  const localPath = getLocalReportPath(report.localFileName);

  if (localPath) {
    try {
      const fileBuffer = await fs.readFile(localPath);
      res.setHeader('Content-Type', report.mimeType || (report.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream'));
      res.setHeader('Content-Length', Buffer.byteLength(fileBuffer));
      res.setHeader('Content-Disposition', `${shouldDownload ? 'attachment' : 'inline'}; filename="${filename}"`);
      res.send(fileBuffer);
      return;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  const sourceUrl = getReportAccessUrl(report, { download: shouldDownload });
  if (!sourceUrl) {
    throw new AppError('Report file URL is unavailable.', StatusCodes.BAD_REQUEST);
  }

  const upstreamResponse = await fetch(sourceUrl);
  if (!upstreamResponse.ok) {
    throw new AppError('Unable to retrieve the requested report file. Please re-upload this report once.', StatusCodes.BAD_GATEWAY);
  }

  const contentType = upstreamResponse.headers.get('content-type') || (report.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream');
  const arrayBuffer = await upstreamResponse.arrayBuffer();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', Buffer.byteLength(Buffer.from(arrayBuffer)));
  res.setHeader('Content-Disposition', `${shouldDownload ? 'attachment' : 'inline'}; filename="${filename}"`);
  res.send(Buffer.from(arrayBuffer));
};

export const deleteReport = async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admin can delete reports.', StatusCodes.FORBIDDEN);
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found.', StatusCodes.NOT_FOUND);
  }

  report.isDeleted = true;
  await report.save();

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'report.archived',
    entityType: 'report',
    entityId: report._id,
    message: `Admin archived report "${report.title}".`,
    metadata: {
      appointmentId: report.appointmentId,
      patientId: report.patientId,
      doctorId: report.doctorId,
      reportType: report.type,
    },
  });

  res.json({ success: true, message: 'Report archived successfully.' });
};

export const restoreReport = async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Only admin can restore reports.', StatusCodes.FORBIDDEN);
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found.', StatusCodes.NOT_FOUND);
  }

  report.isDeleted = false;
  await report.save();

  await Prescription.updateOne(
    { appointment: report.appointmentId },
    { $addToSet: { reports: report._id } }
  );

  await createAuditLog({
    actor: req.user._id,
    actorRole: req.user.role,
    action: 'report.restored',
    entityType: 'report',
    entityId: report._id,
    message: `Admin restored report "${report.title}".`,
    metadata: {
      appointmentId: report.appointmentId,
      patientId: report.patientId,
      doctorId: report.doctorId,
      reportType: report.type,
    },
  });

  const populatedReport = await populateReportQuery(Report.findById(report._id));
  res.json({ success: true, message: 'Report restored successfully.', data: populatedReport });
};
