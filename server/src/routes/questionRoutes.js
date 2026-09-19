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
import { ROLES } from '../constants/roles.js';

const router = express.Router({ mergeParams: true });

// Allowed moderation roles: Organizer and Anchor
const moderationAuth = [
  protect,
  authorize(ROLES.ORGANIZER, ROLES.ANCHOR, 'organizer', 'anchor')
];

// Public / Audience Endpoints
// Submit Question (No organizer role required)
router.post(
  '/',
  validate(createQuestionSchema),
  createQuestion
);

// List Questions with Filtering (status, session, track, sort)
router.get(
  '/',
  validate(queryQuestionsSchema, 'query'),
  listQuestions
);

// Anchor-facing Approved Question Feed
router.get(
  '/approved',
  getApprovedFeedEndpoint
);

router.get(
  '/anchor',
  getApprovedFeedEndpoint
);

// Upvote Question (Audience-accessible with anti-abuse)
router.post(
  '/:id/upvote',
  upvoteQuestionEndpoint
);

// Get Single Question Details
router.get(
  '/:id',
  getQuestionById
);

// Moderation Actions (Requires Organizer or Anchor Authorization)
router.patch(
  '/:id/status',
  ...moderationAuth,
  validate(moderateQuestionSchema),
  moderateQuestionStatus
);

router.patch(
  '/:id/approve',
  ...moderationAuth,
  approveQuestion
);

router.patch(
  '/:id/reject',
  ...moderationAuth,
  rejectQuestion
);

router.patch(
  '/:id/answer',
  ...moderationAuth,
  answerQuestion
);

// AI Co-Pilot Stage Assistance for Question
router.post(
  '/:id/ai-assist',
  ...moderationAuth,
  askAiAssistForQuestion
);

export default router;
