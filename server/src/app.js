import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security headers with helmet
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', routes);

// Root fallback
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'StagePilot Real-Time Backend API Engine',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler for undefined API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Centralized error handling
app.use(errorHandler);

app.default = app;
export default app;
