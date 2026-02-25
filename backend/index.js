require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./utils/mongodb');

// Routes
const userRoutes = require('./routes/userRoutes');
const stockGroupRoutes = require('./routes/stockGroupRoutes');
const productRoutes = require('./routes/productRoutes');
const partyRoutes = require('./routes/partyRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

connectDB();

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
app.use('/api/products', productRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
