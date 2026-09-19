import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import speakerRoutes from './speakerRoutes.js';
import agendaRoutes from './agendaRoutes.js';
import announcementRoutes from './announcementRoutes.js';

const router = express.Router();

// Health-check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'StagePilot Backend API Foundation',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Foundation route mount points
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/speakers', speakerRoutes);
router.use('/agenda', agendaRoutes);
router.use('/announcements', announcementRoutes);

export default router;
