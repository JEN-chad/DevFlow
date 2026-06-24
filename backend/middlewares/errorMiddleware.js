import { config } from '../config/env.js';

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const correlationId = req.correlationId || 'N/A';

  console.error(`[Error] [ID:${correlationId}] ${statusCode} - ${message}`);
  if (err.stack && config.nodeEnv !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    correlationId,
    stack: config.nodeEnv === 'production' ? null : err.stack,
  });
};

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
