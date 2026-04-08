import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

const defaultPatients = [
  {
    name: 'Asha Kumar',
    email: 'asha@example.com',
    password: 'Patient@123',
    phone: '+919888880001',
    age: 29,
    gender: 'female',
    bloodGroup: 'B+',
    address: 'Kolkata, India',
    medicalHistory: ['Seasonal allergy'],
  },
  {
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    password: 'Patient@123',
    phone: '+919888880002',
    age: 35,
    gender: 'male',
    bloodGroup: 'O+',
    address: 'Delhi, India',
    medicalHistory: ['Migraine'],
  },
  {
    name: 'Sneha Patel',
    email: 'sneha@example.com',
    password: 'Patient@123',
    phone: '+919888880003',
    age: 42,
    gender: 'female',
    bloodGroup: 'A+',
    address: 'Mumbai, India',
    medicalHistory: ['Diabetes'],
  },
  {
    name: 'Imran Ali',
    email: 'imran@example.com',
    password: 'Patient@123',
    phone: '+919888880004',
    age: 31,
    gender: 'male',
    bloodGroup: 'AB+',
    address: 'Hyderabad, India',
    medicalHistory: ['Back pain'],
  },
  {
    name: 'Pooja Singh',
    email: 'pooja@example.com',
    password: 'Patient@123',
    phone: '+919888880005',
    age: 26,
    gender: 'female',
    bloodGroup: 'O-',
    address: 'Pune, India',
    medicalHistory: ['Skin sensitivity'],
  },
  {
    name: 'Karan Das',
    email: 'karan@example.com',
    password: 'Patient@123',
    phone: '+919888880006',
    age: 38,
    gender: 'male',
    bloodGroup: 'A-',
    address: 'Bengaluru, India',
    medicalHistory: ['Sinusitis'],
  }
];

const createDemoPatients = async () => {
  await connectDB();

  for (const patientData of defaultPatients) {
    const existingUser = await User.findOne({ email: patientData.email });
    if (existingUser) {
      console.log(`Patient already exists for ${patientData.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(patientData.password, 10);
    const user = await User.create({
      name: patientData.name,
      email: patientData.email,
      password: hashedPassword,
      phone: patientData.phone,
      role: 'patient',
    });

    await Patient.create({
      user: user._id,
      age: patientData.age,
      gender: patientData.gender,
      bloodGroup: patientData.bloodGroup,
      address: patientData.address,
      medicalHistory: patientData.medicalHistory,
    });

    console.log(`Demo patient created for ${patientData.email}`);
  }

  process.exit(0);
};

createDemoPatients().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
