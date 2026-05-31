require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

async function createAdmin() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const firstName = await ask('First Name: ');
    const lastName = await ask('Last Name: ');
    const email = await ask('Email: ');
    const password = await ask('Password (min 6 chars): ');

    if (!firstName || !lastName || !email || !password) {
      console.log('First name, last name, email, and password are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('Password must be at least 6 characters');
      process.exit(1);
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.log('An admin with this email already exists');
      process.exit(1);
    }

    const admin = new Admin({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    await admin.save();

    console.log(`\nAdmin created successfully!`);
    console.log(`Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`Email: ${admin.email}`);
    console.log(`ID: ${admin._id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
