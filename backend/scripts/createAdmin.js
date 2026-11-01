// Create an admin account for the /admin panel.
// Usage (from the backend folder):  npm run create-admin
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('../models/Admin');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(String(answer || '').trim())));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createAdmin() {
  let exitCode = 0;
  try {
    const email = (await ask('Admin email: ')).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new Error('Please enter a valid email address');

    const password = await ask('Admin password (min 6 chars): ');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';
    await mongoose.connect(uri);

    if (await Admin.findOne({ email })) throw new Error(`An admin with email ${email} already exists`);

    const admin = await new Admin({ email, password }).save();

    console.log('\nAdmin created successfully!');
    console.log(`Email: ${admin.email}`);
    console.log('Login at: https://accounting.softwarebytes.in/admin');
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
    process.exit(exitCode);
  }
}

createAdmin();
