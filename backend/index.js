require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./utils/mongodb');
const { ensureCashInHandPartyForAllUsers } = require('./utils/defaultParties');

// Routes
const userRoutes = require('./routes/userRoutes');
const stockGroupRoutes = require('./routes/MasterRoutes/stockGroupRoutes');
const unitRoutes = require('./routes/MasterRoutes/unitRoutes');
const bankRoutes = require('./routes/MasterRoutes/bankRoutes');
const productRoutes = require('./routes/MasterRoutes/productRoutes');
const expenseGroupRoutes = require('./routes/MasterRoutes/expenseGroupRoutes');
const purchaseRoutes = require('./routes/VoucherRoutes/purchaseRoutes');
const saleRoutes = require('./routes/VoucherRoutes/saleRoutes');
const paymentRoutes = require('./routes/VoucherRoutes/paymentRoutes');
const receiptRoutes = require('./routes/VoucherRoutes/receiptRoutes');
const partyRoutes = require('./routes/MasterRoutes/partyRoutes');
const expenseRoutes = require('./routes/VoucherRoutes/expenseRoutes');
const contraRoutes = require('./routes/VoucherRoutes/contraRoutes');
const stockAdjustmentRoutes = require('./routes/VoucherRoutes/stockAdjustmentRoutes');
const saleReturnRoutes = require('./routes/VoucherRoutes/saleReturnRoutes');
const purchaseReturnRoutes = require('./routes/VoucherRoutes/purchaseReturnRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174','https://accounting.softwarebytes.in','https://accountingapi.softwarebytes.in'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/stock-groups', stockGroupRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/products', productRoutes);
app.use('/api/expense-groups', expenseGroupRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/contras', contraRoutes);
app.use('/api/stock-adjustments', stockAdjustmentRoutes);
app.use('/api/sale-returns', saleReturnRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);



const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  await ensureCashInHandPartyForAllUsers();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
