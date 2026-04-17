require('dotenv').config({ path: '../.env' }); // Assuming script runs from /scripts
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/account';

mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 }).then(async () => {
  const Purchase = require('../models/voucher/Purchase');
  const Sale = require('../models/voucher/Sales');
  
  const purchaseCashRes = await Purchase.updateMany({ type: 'cash purchase' }, { $set: { type: 'cash' } });
  const purchaseCreditRes = await Purchase.updateMany({ type: { $in: ['purchase', 'credit purchase'] } }, { $set: { type: 'credit' } });
  
  const saleCashRes = await Sale.updateMany({ type: 'cash sale' }, { $set: { type: 'cash' } });
  const saleCreditRes = await Sale.updateMany({ type: { $in: ['sale', 'credit sale'] } }, { $set: { type: 'credit' } });
  
  console.log(`Updated ${purchaseCashRes.modifiedCount} cash purchases to 'cash'`);
  console.log(`Updated ${purchaseCreditRes.modifiedCount} credit purchases to 'credit'`);
  console.log(`Updated ${saleCashRes.modifiedCount} cash sales to 'cash'`);
  console.log(`Updated ${saleCreditRes.modifiedCount} credit sales to 'credit'`);
  
  console.log('Database migrated successfully');
  process.exit(0);
}).catch(console.error);
