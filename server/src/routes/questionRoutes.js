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

const flexibleModerationAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => {
      return authorize(ROLES.ORGANIZER, ROLES.ANCHOR, 'organizer', 'anchor')(req, res, next);
    });
  }
  if (req.body && req.body.moderatorId) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Not authorized to access this route. Token is missing.'
  });
};

const router = express.Router({ mergeParams: true });

// Public / Audience Endpoints
// Submit Question
router.post(
  '/',
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

router.get(
  '/anchor',
  getApprovedFeedEndpoint
);

// Upvote Question (Audience-accessible with anti-abuse)
router.post(
  '/:id/upvote',
  upvoteQuestionEndpoint
);
router.patch(
  '/:id/upvote',
  upvoteQuestionEndpoint
);

// Get Single Question Details
router.get(
  '/:id',
  getQuestionById
);

// Moderation Actions
router.patch(
  '/:id/status',
  flexibleModerationAuth,
  validate(moderateQuestionSchema),
  moderateQuestionStatus
);

router.patch(
  '/:id/approve',
  flexibleModerationAuth,
  approveQuestion
);
router.post(
  '/:id/approve',
  flexibleModerationAuth,
  approveQuestion
);

router.patch(
  '/:id/reject',
  flexibleModerationAuth,
  rejectQuestion
);
router.post(
  '/:id/reject',
  flexibleModerationAuth,
  rejectQuestion
);

router.patch(
  '/:id/answer',
  flexibleModerationAuth,
  answerQuestion
);
router.post(
  '/:id/answer',
  flexibleModerationAuth,
  answerQuestion
);

// AI Co-Pilot Stage Assistance for Question
router.post(
  '/:id/ai-assist',
  askAiAssistForQuestion
);

export default router;
