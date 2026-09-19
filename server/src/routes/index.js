import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import speakerRoutes from './speakerRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'StagePilot Real-Time API Engine',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/speakers', speakerRoutes);
router.use('/ai', aiRoutes);

export default router;
