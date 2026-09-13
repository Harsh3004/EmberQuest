const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const activityRouter = require('./routes/activity.routes');
const authRouter = require('./routes/auth.routes');
const characterRouter = require('./routes/character.routes');
const healthRouter = require('./routes/health.routes');
const inventoryRouter = require('./routes/inventory.routes');
const questRouter = require('./routes/quest.routes');
const shopRouter = require('./routes/shop.routes');

dotenv.config();

function createApp() {
  const app = express();

  app.use(helmet());
  const allowedOrigin = process.env.CLIENT_ORIGIN;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or same-domain requests)
        if (!origin) return callback(null, true);
        if (
          !allowedOrigin ||
          origin === allowedOrigin ||
          origin === 'http://localhost:5173' ||
          origin === 'http://localhost:3000' ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Basic abuse protection, including brute-force protection for auth.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/quests', questRouter);
  app.use('/api/character', characterRouter);
  app.use('/api/shop', shopRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/activity-log', activityRouter);

  app.use('/api/', notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
