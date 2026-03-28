require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initSocket } = require('./services/socketService');
const subdomainMiddleware = require('./middleware/subdomainMiddleware');

const app = express();
const server = http.createServer(app);

// ── CORS: support comma-separated list of allowed origins ──────────────────
// e.g. FRONTEND_URL=http://localhost:5173,https://yourdomain.com
const rawOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (rawOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin "${origin}" not allowed`));
  },
  credentials: true,
};

// Socket.io setup
const io = new Server(server, { cors: corsOptions });
initSocket(io);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/webhooks/stripe', require('./webhooks/stripeWebhook'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Multi-tenant Subdomain Support
app.use(subdomainMiddleware);

// Routes
app.use('/api/session', require('./routes/session'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/restaurant', require('./routes/restaurant'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use(process.env.NODE_ENV === 'production' ? '/api/coupons' : '/api/coupons', require('./routes/coupons'));
app.use('/api/public', require('./routes/public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-restaurant-platform';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, server, io };
