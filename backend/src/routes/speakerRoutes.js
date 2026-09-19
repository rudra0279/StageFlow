import express from 'express';
import {
  getSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker
} from '../controllers/speakerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSpeakers)
  .post(protect, authorize('organizer'), createSpeaker);

router.route('/:id')
  .patch(protect, authorize('organizer'), updateSpeaker)
  .delete(protect, authorize('organizer'), deleteSpeaker);

export default router;
