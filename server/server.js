const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const goalRoutes = require('./routes/goalRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Global middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/users', userRoutes);

// A small health endpoint makes it easy to confirm that the API is running.
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ message: 'ClearCash API is running' });
});

// Handle malformed JSON and other unexpected Express errors.
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const RENDER_KEEP_ALIVE_INTERVAL_MS = 8 * 60 * 1000;

const startRenderKeepAlive = (server) => {
  if (process.env.RENDER !== 'true' || !process.env.RENDER_EXTERNAL_URL) return;

  const healthUrl = new URL('/health', process.env.RENDER_EXTERNAL_URL).toString();
  let requestInProgress = false;

  const interval = setInterval(async () => {
    if (requestInProgress) return;
    requestInProgress = true;

    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      await response.text();

      if (!response.ok) {
        console.warn(`Render keep-alive returned HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`Render keep-alive failed: ${error.message}`);
    } finally {
      requestInProgress = false;
    }
  }, RENDER_KEEP_ALIVE_INTERVAL_MS);

  // Do not let the timer delay a normal process shutdown.
  interval.unref();
  server.once('close', () => clearInterval(interval));
  console.log('Render keep-alive enabled (every 4 minutes)');
};

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    if (!allowedOrigins.length) throw new Error('CORS_ORIGIN is not defined');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const server = app.listen(PORT, () => {
      console.log(`ClearCash API listening on port ${PORT}`);
      startRenderKeepAlive(server);
    });

    return server;
  } catch (error) {
    console.error(`Unable to start server: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) startServer();

module.exports = { app, startServer, startRenderKeepAlive };

