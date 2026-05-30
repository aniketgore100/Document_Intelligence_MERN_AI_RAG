import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
// import { serverAdapter } from './src/config/bullBoard.js';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import organizationRoutes from './src/routes/organizationRoutes.js';
import roleRoutes from './src/routes/roleRoutes.js';
import organizationInviteRoutes from './src/routes/organizationInviteRoutes.js';
import departmentRoutes from './src/routes/departmentRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;


app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

app.options(/.*/, cors());
app.use(helmet());

app.use(express.urlencoded({ extended: true }));
// app.use('/admin/queues', serverAdapter.getRouter());

app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/organization-invites', organizationInviteRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);

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
