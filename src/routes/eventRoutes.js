// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

const speakerRoutes = require('./speakerRoutes');
const agendaRoutes = require('./agendaRoutes');
const sessionRoutes = require('./sessionRoutes');
const announcementRoutes = require('./announcementRoutes');

// Nested subroutes for an event
router.use('/:eventId/speakers', speakerRoutes);
router.use('/:eventId/agenda', agendaRoutes);
router.use('/:eventId/sessions', sessionRoutes);
router.use('/:eventId/announcements', announcementRoutes);

// Event CRUD
router.route('/')
  .post(authenticate, eventController.createEvent)
  .get(eventController.getEvents);

router.route('/:id')
  .get(eventController.getEventById)
  .put(authenticate, eventController.updateEvent)
  .delete(authenticate, eventController.deleteEvent);

router.get('/:id/live-state', eventController.getLiveState);

module.exports = router;
