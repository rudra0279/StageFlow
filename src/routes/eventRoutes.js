// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, requireRole } = require('../middleware/auth');

const speakerRoutes = require('./speakerRoutes');
const agendaRoutes = require('./agendaRoutes');
const sessionRoutes = require('./sessionRoutes');
const announcementRoutes = require('./announcementRoutes');
const questionRoutes = require('./questionRoutes');
const committeeRoutes = require('./committeeRoutes');
const taskRoutes = require('./taskRoutes');
const chatRoutes = require('./chatRoutes');

// Nested subroutes for an event
router.use('/:eventId/speakers', speakerRoutes);
router.use('/:eventId/agenda', agendaRoutes);
router.use('/:eventId/sessions', sessionRoutes);
router.use('/:eventId/announcements', announcementRoutes);
router.use('/:eventId/questions', questionRoutes);
router.use('/:eventId/committee', committeeRoutes);
router.use('/:eventId/tasks', taskRoutes);
router.use('/:eventId/chat', chatRoutes);

// Available work types (static catalog)
router.get('/work-types/available', eventController.getAvailableWorkTypes);

// Event CRUD
router.route('/')
  .post(authenticate, eventController.createEvent)
  .get(eventController.getEvents);

const { optionalAuthenticate } = require('../middleware/auth');
const orgOps = require('../controllers/organizerOperationsController');

router.route('/:id')
  .get(eventController.getEventById)
  .put(authenticate, eventController.updateEvent)
  .delete(authenticate, eventController.deleteEvent);

router.get('/:id/live-state', eventController.getLiveState);
router.get('/:id/run-of-show', eventController.getRunOfShow);
router.get('/:id/export', eventController.getRunOfShow);

<<<<<<< Updated upstream
// Event Work Types configuration
router.get('/:id/work-types', eventController.getEventWorkTypes);
router.put(
  '/:id/work-types',
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
  eventController.updateEventWorkTypes
);

// Run-of-Show PDF Exporter Data Endpoints (Stage 5)
router.get(
  '/:id/run-of-show',
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
  eventController.getRunOfShow
);
router.get(
  '/:id/export',
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
  eventController.getRunOfShow
);
=======
// Organizer Committee Directory
router.get('/:id/committee', optionalAuthenticate, orgOps.getCommittee);

// Task Management
router.route('/:id/tasks')
  .get(optionalAuthenticate, orgOps.getTasks)
  .post(optionalAuthenticate, orgOps.createTask);

router.post('/:id/tasks/batch', optionalAuthenticate, orgOps.batchCreateTasks);

router.route('/:id/tasks/:taskId')
  .patch(optionalAuthenticate, orgOps.updateTask)
  .delete(optionalAuthenticate, orgOps.deleteTask);

// Organizer Command Chat
router.route('/:id/messages')
  .get(optionalAuthenticate, orgOps.getMessages)
  .post(optionalAuthenticate, orgOps.sendMessage);
>>>>>>> Stashed changes

module.exports = router;
