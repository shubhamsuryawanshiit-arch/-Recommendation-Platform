import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.MONGODB_URI) throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD, and MONGODB_URI in server/.env first.');
if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
await mongoose.connect(process.env.MONGODB_URI);
try {
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const user = await User.findOne({ email });
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  if (user) { user.role = 'admin'; user.password = password; await user.save(); }
  else await User.create({ name: 'WatchWise Admin', email, password, role: 'admin' });
  console.log(`Admin account provisioned for ${email}.`);
} finally { await mongoose.disconnect(); }
