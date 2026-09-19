import express from 'express';
import {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  setStatus,
  broadcastAnnouncement
} from '../controllers/eventController.js';
import sessionRoutes from './sessionRoutes.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createEventSchema, updateEventSchema } from '../validators/eventValidator.js';
import { broadcastAlertSchema } from '../validators/sessionValidator.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Forward session routes: /api/events/:eventId/sessions
router.use('/:eventId/sessions', sessionRoutes);

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorize(ROLES.ORGANIZER), validate(createEventSchema), createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, authorize(ROLES.ORGANIZER), updateEvent)
  .patch(protect, authorize(ROLES.ORGANIZER), updateEvent)
  .delete(protect, authorize(ROLES.ORGANIZER), deleteEvent);

router.patch(
  '/:id/status',
  protect,
  authorize(ROLES.ORGANIZER),
  validate(updateEventSchema),
  setStatus
);

router.post(
  '/:id/broadcast',
  protect,
  authorize(ROLES.ORGANIZER),
  validate(broadcastAlertSchema),
  broadcastAnnouncement
);

export default router;
