import express from 'express';
import {
  addSession,
  triggerDelay,
  activateSession,
  updateScript
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createSessionSchema, triggerDelaySchema } from '../validators/sessionValidator.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router({ mergeParams: true });

// Add session to event agenda
router.post(
  '/',
  protect,
  authorize(ROLES.ORGANIZER),
  validate(createSessionSchema),
  addSession
);

// Inject delay to session (+5, +10, +15m)
router.post(
  '/:sessionId/delay',
  protect,
  authorize(ROLES.ORGANIZER),
  validate(triggerDelaySchema),
  triggerDelay
);

// Switch live session on stage
router.patch(
  '/:sessionId/activate',
  protect,
  authorize(ROLES.ORGANIZER),
  activateSession
);

// Save or update an AI script on the session
router.patch(
  '/:sessionId/script',
  protect,
  updateScript
);

export default router;
