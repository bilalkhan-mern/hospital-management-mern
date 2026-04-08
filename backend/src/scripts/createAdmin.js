import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const createAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@hospital.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log(`Admin already exists for ${email}`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name: 'System Admin',
    email,
    password: hashedPassword,
    role: 'admin',
    adminType: 'super_admin',
    phone: '+910000000000',
  });

  console.log(`Admin created successfully for ${email}`);
  process.exit(0);
};

createAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
