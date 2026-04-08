import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Department from '../models/Department.js';

const defaultDepartments = [
  { name: 'Cardiology', description: 'Heart and vascular care' },
  { name: 'Neurology', description: 'Brain and nervous system care' },
  { name: 'Orthopedics', description: 'Bone and joint care' },
  { name: 'Dermatology', description: 'Skin, hair, and nail care' },
  { name: 'Pediatrics', description: 'Child and adolescent care' },
  { name: 'Gynecology', description: 'Women health and reproductive care' },
  { name: 'ENT', description: 'Ear, nose, and throat care' },
  { name: 'General Medicine', description: 'Primary and internal medicine care' }
];

const defaultDoctors = [
  {
    name: 'Dr. Neha Sharma',
    email: 'neha@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999991',
    department: 'Cardiology',
    specialization: 'Cardiologist',
    qualification: 'MD Cardiology',
    experience: 8,
    consultationFee: 900,
    bio: 'Specialist in preventive cardiology and routine heart care.',
    schedule: { workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], startTime: '09:00', endTime: '13:00', slotDuration: 30 },
  },
  {
    name: 'Dr. Arjun Mehta',
    email: 'arjun@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999992',
    department: 'Neurology',
    specialization: 'Neurologist',
    qualification: 'DM Neurology',
    experience: 10,
    consultationFee: 1200,
    bio: 'Focused on headaches, epilepsy, and neuro follow-up care.',
    schedule: { workingDays: ['monday', 'wednesday', 'friday', 'saturday'], startTime: '10:00', endTime: '15:00', slotDuration: 30 },
  },
  {
    name: 'Dr. Kavya Rao',
    email: 'kavya@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999993',
    department: 'Dermatology',
    specialization: 'Dermatologist',
    qualification: 'MD Dermatology',
    experience: 6,
    consultationFee: 700,
    bio: 'Provides treatment for skin allergies, acne, and long-term skin care.',
    schedule: { workingDays: ['tuesday', 'thursday', 'friday', 'saturday'], startTime: '09:30', endTime: '14:30', slotDuration: 20 },
  },
  {
    name: 'Dr. Rohan Iyer',
    email: 'rohan@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999994',
    department: 'Orthopedics',
    specialization: 'Orthopedic Surgeon',
    qualification: 'MS Orthopedics',
    experience: 11,
    consultationFee: 1100,
    bio: 'Treats fractures, joint pain, and mobility-related conditions.',
    schedule: { workingDays: ['monday', 'tuesday', 'thursday', 'friday'], startTime: '10:30', endTime: '16:30', slotDuration: 30 },
  },
  {
    name: 'Dr. Priya Nair',
    email: 'priya@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999995',
    department: 'Pediatrics',
    specialization: 'Pediatrician',
    qualification: 'MD Pediatrics',
    experience: 9,
    consultationFee: 800,
    bio: 'Works with infant wellness, childhood infections, and growth monitoring.',
    schedule: { workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], startTime: '09:00', endTime: '14:00', slotDuration: 20 },
  },
  {
    name: 'Dr. Sana Khan',
    email: 'sana@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999996',
    department: 'Gynecology',
    specialization: 'Gynecologist',
    qualification: 'MS Obstetrics and Gynecology',
    experience: 12,
    consultationFee: 1000,
    bio: 'Supports women health, reproductive care, and routine gynecology follow-ups.',
    schedule: { workingDays: ['monday', 'wednesday', 'thursday', 'friday', 'saturday'], startTime: '11:00', endTime: '17:00', slotDuration: 30 },
  },
  {
    name: 'Dr. Vivek Menon',
    email: 'vivek@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999997',
    department: 'ENT',
    specialization: 'ENT Specialist',
    qualification: 'MS ENT',
    experience: 7,
    consultationFee: 750,
    bio: 'Handles sinus issues, throat infections, and hearing-related complaints.',
    schedule: { workingDays: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'], startTime: '08:30', endTime: '13:30', slotDuration: 20 },
  },
  {
    name: 'Dr. Meera Joshi',
    email: 'meera@hospital.com',
    password: 'Doctor@123',
    phone: '+919999999998',
    department: 'General Medicine',
    specialization: 'General Physician',
    qualification: 'MD General Medicine',
    experience: 13,
    consultationFee: 650,
    bio: 'Provides first-line diagnosis, preventive care, and chronic illness follow-up.',
    schedule: { workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], startTime: '09:15', endTime: '16:15', slotDuration: 30 },
  }
];

const createDemoDoctors = async () => {
  await connectDB();

  const departmentMap = {};
  for (const departmentData of defaultDepartments) {
    let department = await Department.findOne({ name: departmentData.name });
    if (!department) {
      department = await Department.create(departmentData);
    }
    departmentMap[department.name] = department;
  }

  for (const doctorData of defaultDoctors) {
    const existingUser = await User.findOne({ email: doctorData.email });
    if (existingUser) {
      const existingDoctor = await Doctor.findOne({ user: existingUser._id });
      if (existingDoctor) {
        existingDoctor.department = departmentMap[doctorData.department]._id;
        existingDoctor.specialization = doctorData.specialization;
        existingDoctor.qualification = doctorData.qualification;
        existingDoctor.experience = doctorData.experience;
        existingDoctor.consultationFee = doctorData.consultationFee;
        existingDoctor.bio = doctorData.bio;
        existingDoctor.schedule = doctorData.schedule;
        existingDoctor.isApproved = true;
        await existingDoctor.save();
      }
      console.log(`Doctor already exists for ${doctorData.email}, schedule refreshed`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(doctorData.password, 10);
    const user = await User.create({
      name: doctorData.name,
      email: doctorData.email,
      password: hashedPassword,
      phone: doctorData.phone,
      role: 'doctor',
    });

    await Doctor.create({
      user: user._id,
      department: departmentMap[doctorData.department]._id,
      specialization: doctorData.specialization,
      qualification: doctorData.qualification,
      experience: doctorData.experience,
      consultationFee: doctorData.consultationFee,
      bio: doctorData.bio,
      schedule: doctorData.schedule,
      isApproved: true,
    });

    console.log(`Demo doctor created for ${doctorData.email}`);
  }

  process.exit(0);
};

createDemoDoctors().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
