import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from './config/db';
import { seedData } from './seed';
import User from './models/User';
import Invoice from './models/Invoice';
import { localStore } from './storage/localStore';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import productRoutes from './routes/productRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import shippingRoutes from './routes/shippingRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import expenseRoutes from './routes/expenseRoutes';
import financeRoutes from './routes/financeRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Connect to MongoDB & Seed if empty
connectDB().then(async () => {
  localStore.removeClientPortalData();
  if (mongoose.connection.readyState === 1) {
    await Promise.all([
      User.deleteMany({ role: 'client' }),
      User.updateMany({}, { $unset: { clientId: 1 } }),
      mongoose.connection.collection('customerorders').deleteMany({}),
      mongoose.connection.collection('notifications').deleteMany({}),
      Invoice.updateMany({}, [{
        $set: {
          payments: { $ifNull: ['$payments', []] },
          paidAmount: {
            $ifNull: [
              '$paidAmount',
              { $cond: [{ $eq: ['$status', 'paid'] }, '$total', { $sum: '$payments.amount' }] },
            ],
          },
        },
      }]),
    ]);
  }

  if (process.env.NODE_ENV !== 'production') {
    await seedData(false);
    return;
  }

  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password || password.length < 8) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 8 characters to initialize the production administrator');
  }

  await User.create({ name, email, password, role: 'admin' });
  console.log(`✅ Initial administrator created for ${email}`);
}).catch((error) => {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
});

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/finance', financeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Invoice API is running 🚀' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
