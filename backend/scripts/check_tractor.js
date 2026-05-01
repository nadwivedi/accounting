const mongoose = require('mongoose');
const Product = require('./backend/models/master/Stock');
const User = require('./backend/models/User');

async function checkTractor() {
  await mongoose.connect('mongodb://localhost:27017/accounting'); // Assuming this is the DB name based on corpus
  const tractors = await Product.find({ name: /tractor/i });
  console.log('Tractors found:', JSON.stringify(tractors, null, 2));
  await mongoose.disconnect();
}

checkTractor().catch(console.error);
