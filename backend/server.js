import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { configurePassport } from './config/passport.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import repositoryRoutes from './routes/repositoryRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { requestTracker } from './middlewares/requestTracker.js';
import { sanitizeInput } from './middlewares/sanitizeMiddleware.js';

import { createServer } from 'http';
import { initSocket } from './config/socket.js';

// Create Express app
const app = express();

// Connect to Database
connectDB();

// Configure Passport
configurePassport();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS setup allowing cookies
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsing Middleware
app.use(
  express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Cookie Parser
app.use(cookieParser());

// 5. Rate Limiting for APIs
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// 6. Passport Middleware
app.use(passport.initialize());

// 7. Request tracking and Input Sanitization
app.use(requestTracker);
app.use(sanitizeInput);

// 8. Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] [ID:${req.correlationId || 'N/A'}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 9. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', sprintRoutes);
app.use('/api', taskRoutes);
app.use('/api', activityRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);


// Root route check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DevFlow API Server is running smoothly.',
  });
});

// 9. Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
