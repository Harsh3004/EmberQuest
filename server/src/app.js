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
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
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
