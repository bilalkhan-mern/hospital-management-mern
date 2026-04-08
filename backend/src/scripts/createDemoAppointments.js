import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';

const dayOffset = (offset) => {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const demoAppointments = [
  {
    patientEmail: 'asha@example.com',
    doctorEmail: 'meera@hospital.com',
    date: dayOffset(2),
    timeSlot: '10:15 - 10:45',
    status: 'pending',
    amount: 650,
    paymentStatus: 'unpaid',
    paymentMethod: '',
    symptoms: 'Low fever and fatigue for 2 days',
  },
  {
    patientEmail: 'asha@example.com',
    doctorEmail: 'neha@hospital.com',
    date: dayOffset(-12),
    timeSlot: '09:00 - 09:30',
    status: 'completed',
    amount: 900,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    symptoms: 'Occasional chest discomfort during walking',
    diagnosis: 'Mild hypertension with exertional discomfort',
    advice: 'Reduce salt intake, track blood pressure, and review after 2 weeks.',
    medicines: [
      { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', days: 14, notes: 'Take after breakfast' },
      { name: 'Pantoprazole', dosage: '40 mg', frequency: 'Once daily', days: 7, notes: 'Before breakfast if acidity occurs' },
    ],
  },
  {
    patientEmail: 'asha@example.com',
    doctorEmail: 'vivek@hospital.com',
    date: dayOffset(-3),
    timeSlot: '08:30 - 08:50',
    status: 'cancelled',
    amount: 750,
    paymentStatus: 'unpaid',
    paymentMethod: '',
    symptoms: 'Blocked nose and throat irritation',
  },
  {
    patientEmail: 'rahul@example.com',
    doctorEmail: 'arjun@hospital.com',
    date: dayOffset(-9),
    timeSlot: '10:00 - 10:30',
    status: 'completed',
    amount: 1200,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    symptoms: 'Migraine episodes with light sensitivity',
    diagnosis: 'Migraine without aura',
    advice: 'Stay hydrated, avoid screen exposure during severe episodes.',
    medicines: [
      { name: 'Sumatriptan', dosage: '50 mg', frequency: 'As needed', days: 10, notes: 'Only during migraine onset' },
      { name: 'Naproxen', dosage: '250 mg', frequency: 'Twice daily', days: 5, notes: 'Take after meals' },
    ],
  },
  {
    patientEmail: 'sneha@example.com',
    doctorEmail: 'sana@hospital.com',
    date: dayOffset(1),
    timeSlot: '11:00 - 11:30',
    status: 'pending',
    amount: 1000,
    paymentStatus: 'unpaid',
    paymentMethod: '',
    symptoms: 'Irregular cycle and lower abdominal pain',
  },
  {
    patientEmail: 'pooja@example.com',
    doctorEmail: 'kavya@hospital.com',
    date: dayOffset(-6),
    timeSlot: '09:30 - 09:50',
    status: 'completed',
    amount: 700,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    symptoms: 'Acne flare with itching around jawline',
    diagnosis: 'Hormonal acne with contact irritation',
    advice: 'Avoid oily cosmetics and use sunscreen daily.',
    medicines: [
      { name: 'Clindamycin Gel', dosage: 'Apply thin layer', frequency: 'Twice daily', days: 21, notes: 'External use only' },
      { name: 'Cetirizine', dosage: '10 mg', frequency: 'Once at night', days: 5, notes: 'For itching' },
    ],
  },
  {
    patientEmail: 'imran@example.com',
    doctorEmail: 'rohan@hospital.com',
    date: dayOffset(3),
    timeSlot: '10:30 - 11:00',
    status: 'pending',
    amount: 1100,
    paymentStatus: 'unpaid',
    paymentMethod: '',
    symptoms: 'Lower back pain after lifting weight',
  },
  {
    patientEmail: 'karan@example.com',
    doctorEmail: 'vivek@hospital.com',
    date: dayOffset(-4),
    timeSlot: '09:10 - 09:30',
    status: 'completed',
    amount: 750,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    symptoms: 'Sinus pressure and throat irritation',
    diagnosis: 'Acute sinusitis with post-nasal drip',
    advice: 'Steam inhalation twice daily and avoid cold beverages.',
    medicines: [
      { name: 'Levocetirizine', dosage: '5 mg', frequency: 'Once at night', days: 7, notes: '' },
      { name: 'Saline Nasal Spray', dosage: '2 sprays', frequency: 'Three times daily', days: 7, notes: 'Each nostril' },
    ],
  },
  {
    patientEmail: 'sneha@example.com',
    doctorEmail: 'meera@hospital.com',
    date: dayOffset(-2),
    timeSlot: '11:15 - 11:45',
    status: 'completed',
    amount: 650,
    paymentStatus: 'unpaid',
    paymentMethod: '',
    symptoms: 'General weakness and high sugar readings',
  },
];

const createDemoAppointments = async () => {
  await connectDB();

  for (const item of demoAppointments) {
    const patientUser = await User.findOne({ email: item.patientEmail, role: 'patient' });
    const doctorUser = await User.findOne({ email: item.doctorEmail, role: 'doctor' });

    if (!patientUser || !doctorUser) {
      console.log(`Skipped ${item.patientEmail} -> ${item.doctorEmail}; missing user`);
      continue;
    }

    const patient = await Patient.findOne({ user: patientUser._id });
    const doctor = await Doctor.findOne({ user: doctorUser._id });

    if (!patient || !doctor) {
      console.log(`Skipped ${item.patientEmail} -> ${item.doctorEmail}; missing profile`);
      continue;
    }

    let appointment = await Appointment.findOne({
      patient: patient._id,
      doctor: doctor._id,
      date: item.date,
      timeSlot: item.timeSlot,
    });

    if (!appointment) {
      appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        date: item.date,
        timeSlot: item.timeSlot,
        status: item.status,
        symptoms: item.symptoms,
        amount: item.amount || doctor.consultationFee || 0,
        paymentStatus: item.paymentStatus || 'unpaid',
        paymentMethod: item.paymentMethod || '',
        paidAt: item.paymentStatus === 'paid' ? new Date() : undefined,
      });
      console.log(`Demo appointment created for ${item.patientEmail} with ${item.doctorEmail}`);
    } else {
      appointment.status = item.status;
      appointment.symptoms = item.symptoms;
      appointment.amount = item.amount || doctor.consultationFee || 0;
      appointment.paymentStatus = item.paymentStatus || 'unpaid';
      appointment.paymentMethod = item.paymentMethod || '';
      appointment.paidAt = item.paymentStatus === 'paid' ? new Date() : undefined;
      await appointment.save();
      console.log(`Demo appointment refreshed for ${item.patientEmail} with ${item.doctorEmail}`);
    }

    if (item.diagnosis && Array.isArray(item.medicines) && item.medicines.length) {
      const existingPrescription = await Prescription.findOne({ appointment: appointment._id });

      if (!existingPrescription) {
        await Prescription.create({
          appointment: appointment._id,
          doctor: doctor._id,
          patient: patient._id,
          diagnosis: item.diagnosis,
          advice: item.advice || '',
          medicines: item.medicines,
        });
        console.log(`Prescription created for ${item.patientEmail} with ${item.doctorEmail}`);
      } else {
        existingPrescription.diagnosis = item.diagnosis;
        existingPrescription.advice = item.advice || '';
        existingPrescription.medicines = item.medicines;
        await existingPrescription.save();
        console.log(`Prescription refreshed for ${item.patientEmail} with ${item.doctorEmail}`);
      }
    }
  }

  process.exit(0);
};

createDemoAppointments().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
