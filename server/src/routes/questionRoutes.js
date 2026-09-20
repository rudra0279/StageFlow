import express from 'express';
import {
  createQuestion,
  listQuestions,
  getApprovedFeedEndpoint,
  getQuestionById,
  moderateQuestionStatus,
  approveQuestion,
  rejectQuestion,
  answerQuestion,
  upvoteQuestionEndpoint,
  askAiAssistForQuestion
} from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createQuestionSchema,
  moderateQuestionSchema,
  queryQuestionsSchema
} from '../validators/questionValidator.js';
import {
  questionSubmitLimiter,
  questionUpvoteLimiter,
  aiLimiter
} from '../middleware/rateLimitMiddleware.js';
import { ROLES } from '../constants/roles.js';

/**
 * Moderation Authorization: Strictly requires valid authentication and Organizer or Anchor role.
 * Removed bypass that allowed arbitrary moderatorId in request body without token.
 */
const moderationAuth = (req, res, next) => {
  return protect(req, res, () => {
    return authorize(ROLES.ORGANIZER, ROLES.ANCHOR, 'organizer', 'anchor')(req, res, next);
  });
};

const router = express.Router({ mergeParams: true });

// Public / Audience Endpoints
// Submit Question (Rate limited & validated)
router.post(
  '/',
  questionSubmitLimiter,
  validate(createQuestionSchema),
  createQuestion
);

// List Questions with Filtering
router.get(
  '/',
  validate(queryQuestionsSchema, 'query'),
  listQuestions
);

// Anchor-facing Approved Question Feed (/anchor and /approved)
router.get(
  '/anchor',
  getApprovedFeedEndpoint
);
router.get(
  '/approved',
  getApprovedFeedEndpoint
);

// Upvote Question (Audience-accessible with rate limiting)
router.post(
  '/:id/upvote',
  questionUpvoteLimiter,
  upvoteQuestionEndpoint
);
router.patch(
  '/:id/upvote',
  questionUpvoteLimiter,
  upvoteQuestionEndpoint
);

// Get Single Question Details
router.get(
  '/:id',
  getQuestionById
);

// Moderation Actions (Protected: Organizer or Anchor only)
router.patch(
  '/:id/status',
  moderationAuth,
  validate(moderateQuestionSchema),
  moderateQuestionStatus
);

router.patch(
  '/:id/approve',
  moderationAuth,
  approveQuestion
);
router.post(
  '/:id/approve',
  moderationAuth,
  approveQuestion
);

router.patch(
  '/:id/reject',
  moderationAuth,
  rejectQuestion
);
router.post(
  '/:id/reject',
  moderationAuth,
  rejectQuestion
);

router.patch(
  '/:id/answer',
  moderationAuth,
  answerQuestion
);
router.post(
  '/:id/answer',
  moderationAuth,
  answerQuestion
);

// AI Co-Pilot Stage Assistance for Question (Protected & Rate Limited)
router.post(
  '/:id/ai-assist',
  protect,
  authorize(ROLES.ORGANIZER, ROLES.ANCHOR, 'organizer', 'anchor'),
  aiLimiter,
  askAiAssistForQuestion
);

export default router;
