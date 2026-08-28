import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/appError.js';

// Import Route Handlers
import productRouter from './routes/product.routes.js';
import customerRouter from './routes/customer.routes.js';
import supplierRouter from './routes/supplier.routes.js';
import purchaseRouter from './routes/purchase.routes.js';
import saleRouter from './routes/sale.routes.js';
import paymentRouter from './routes/payment.routes.js';
import invoiceRouter from './routes/invoice.routes.js';
import quotationRouter from './routes/quotation.routes.js';
import stockRouter from './routes/stock.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import uploadRouter from './routes/upload.routes.js';
import settingsRouter from './routes/settings.routes.js';
import reportRouter from './routes/report.routes.js';
import authRouter from './routes/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const getClientDistDir = (): string | null => {
  const candidatePaths = [
    process.env.CLIENT_DIST_PATH || '',
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), './client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist')
  ];
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
};
const CLIENT_DIST_DIR = getClientDistDir();

const app = express();

// Security Middlewares with cross-origin resource policy for uploaded image assets
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration (load CLIENT_URL from environment with local fallbacks)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Basic Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10kb' }));

// Serve static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const status = dbStatus === 'connected' ? 200 : 500;
  
  res.status(status).json({
    success: dbStatus === 'connected',
    message: 'Inventory API is running',
    database: dbStatus
  });
});

// 2. Register API Routes
app.use('/api/products', productRouter);
app.use('/api/customers', customerRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/sales', saleRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/quotations', quotationRouter);
app.use('/api/stock', stockRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reports', reportRouter);
app.use('/api/auth', authRouter);

// 3. Production Static Assets & SPA Client Fallback
if (CLIENT_DIST_DIR) {
  app.use(express.static(CLIENT_DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
  });
}

// 4. Fallback API Route Not Found (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. Centralized Global Error Handler
app.use(errorHandler);

export default app;
