import express from 'express';
import {
  getSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  getSpeakerByIdOrEvent
} from '../controllers/speakerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.route('/')
  .get(protect, getSpeakers)
  .post(protect, authorize(ROLES.ORGANIZER), createSpeaker);

router.route('/:id')
  .get(protect, getSpeakerByIdOrEvent)
  .put(protect, authorize(ROLES.ORGANIZER), updateSpeaker)
  .patch(protect, authorize(ROLES.ORGANIZER), updateSpeaker)
  .delete(protect, authorize(ROLES.ORGANIZER), deleteSpeaker);

export default router;
