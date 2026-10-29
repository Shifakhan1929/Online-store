import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions =
  corsOrigin && corsOrigin !== '*'
    ? {
        origin: corsOrigin.includes(',')
          ? corsOrigin.split(',').map((origin) => origin.trim())
          : corsOrigin.trim(),
        credentials: true,
      }
    : undefined;

app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
