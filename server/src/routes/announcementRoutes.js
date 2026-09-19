import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  dismissAnnouncement
} from '../controllers/announcementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.route('/')
  .get(protect, getAnnouncements)
  .post(protect, authorize(ROLES.ORGANIZER), createAnnouncement);

router.route('/:id/dismiss')
  .patch(protect, dismissAnnouncement);

export default router;
