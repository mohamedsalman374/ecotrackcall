const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security Headers ─────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS Configuration ───────────────────────────────────────
const allowedOrigins = [
  env.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development allow any localhost origin
      if (env.isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Safe Request Logging ─────────────────────────────────────
// Log requests in development without exposing sensitive headers
if (env.isDev) {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
} else {
  app.use(morgan('combined'));
}

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isDev ? 1000 : 200, // Generous limit in dev to prevent blocking tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// ── Root & Health Check ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'EcoTrack REST API',
    version: '2.0.0',
    description: 'AI-Based Carbon Footprint Calculator & Eco Recommendation System',
    status: 'running',
    endpoints: {
      health: '/health',
      apiV1: '/api/v1',
      api: '/api',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    app: 'EcoTrack REST API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ── API Routes (Mounted on both /api/v1 and /api for compatibility) ──
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Centralized Error Handler ────────────────────────────────
app.use(errorHandler);

// ── Server Startup ───────────────────────────────────────────
const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🌱 EcoTrack Backend running in [${env.nodeEnv}] mode`);
  console.log(`🚀 Server listening on http://localhost:${env.port} (0.0.0.0:${env.port})`);
  console.log(`🛡️  CORS allowed for: ${allowedOrigins.join(', ')}`);
  console.log(`🤖 Groq Model configured: ${env.groq.model}`);
  console.log(`=======================================================`);
});

// ── Graceful Shutdown ────────────────────────────────────────
const handleShutdown = (signal) => {
  console.log(`\n[server] Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('[server] Closed active HTTP connections. Process exiting.');
    process.exit(0);
  });
  // Force shutdown after 5s if still hanging
  setTimeout(() => {
    console.error('[server] Forcefully terminating.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
