import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import organizationRoutes from './src/routes/organizationRoutes.js';
import organizationInviteRoutes from './src/routes/organizationInviteRoutes.js';
import departmentRoutes from './src/routes/departmentRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import membershipRoutes from './src/routes/membershipRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error('Not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
};

app.use(express.json({ limit: '2mb' }));
app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));
app.use(helmet());

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 50,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/organization-invites', organizationInviteRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/workspaces', workspaceRoutes);

// ── Error handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`, { stack: err.stack });
});
