import dotenv from 'dotenv';

// Initialize dotenv at the top-level of configuration
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/devflow',
  
  // JWT tokens
  jwtAccessSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'devflow_super_secret_access_key_1234567890',
  jwtAccessExpiration: process.env.JWT_EXPIRE || process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'devflow_super_secret_refresh_key_1234567890',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRE || process.env.JWT_REFRESH_EXPIRATION || '7d',
  
  // CORS & Client URL
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // GitHub OAuth settings
  githubClientId: process.env.GITHUB_CLIENT_ID || 'placeholder',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder',
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
  
  // API protections
  rateLimitWindow: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // default 15 mins
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100, // default 100 requests
  
  // Logging and webhooks
  logLevel: process.env.LOG_LEVEL || 'info',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'devflow_webhook_secret_key_123',
};
