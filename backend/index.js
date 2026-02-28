require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./utils/mongodb');

// Routes
const userRoutes = require('./routes/userRoutes');
const stockGroupRoutes = require('./routes/stockGroupRoutes');
const groupRoutes = require('./routes/groupRoutes');
const unitRoutes = require('./routes/unitRoutes');
const productRoutes = require('./routes/productRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const contraRoutes = require('./routes/contraRoutes');
const stockAdjustmentVoucherRoutes = require('./routes/stockAdjustmentVoucherRoutes');
const saleReturnRoutes = require('./routes/saleReturnRoutes');
const purchaseReturnRoutes = require('./routes/purchaseReturnRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors({
  origin:['http://localhost:5173','http://localhost:5176'],
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
app.use('/api/groups', groupRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/leadgers', ledgerRoutes);
app.use('/api/contras', contraRoutes);
app.use('/api/stock-adjustment-vouchers', stockAdjustmentVoucherRoutes);
app.use('/api/sale-returns', saleReturnRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);



const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
