import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorize('organizer'), createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .patch(protect, authorize('organizer'), updateEvent)
  .delete(protect, authorize('organizer'), deleteEvent);

export default router;
