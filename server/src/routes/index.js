import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import speakerRoutes from './speakerRoutes.js';
import aiRoutes from './aiRoutes.js';
import announcementRoutes from './announcementRoutes.js';
import agendaRoutes from './agendaRoutes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'StagePilot Real-Time API Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/sessions', sessionRoutes);
router.use('/speakers', speakerRoutes);
router.use('/ai', aiRoutes);
router.use('/announcements', announcementRoutes);
router.use('/agenda', agendaRoutes);

export default router;
