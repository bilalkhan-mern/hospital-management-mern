import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const upsertAdmin = async ({ name, email, password, adminType = 'admin' }) => {
  const existing = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (existing) {
    existing.name = name;
    existing.role = 'admin';
    existing.adminType = adminType;
    existing.isActive = true;
    existing.password = hashedPassword;
    await existing.save();
    return { email, updated: true };
  }

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    adminType,
    isActive: true,
    phone: '+910000000000',
  });

  return { email, updated: false };
};

const run = async () => {
  await connectDB();

  const password = process.env.DEMO_ADMIN_PASSWORD || 'Admin@123';

  const results = [];
  results.push(await upsertAdmin({ name: 'Demo Admin', email: 'admin2@hospital.com', password, adminType: 'admin' }));

  results.forEach((item) => {
    console.log(`${item.updated ? 'Updated' : 'Created'} admin: ${item.email}`);
  });

  process.exit(0);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
