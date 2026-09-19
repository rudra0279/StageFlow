import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Middleware
app.use(cors({
  origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', routes);

// Root fallback
app.get('/', (req, res) => {
  res.send('StagePilot Real-Time Backend API is running.');
});

// Centralized error handling
app.use(errorHandler);

export default app;
