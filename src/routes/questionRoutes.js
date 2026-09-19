// src/routes/questionRoutes.js
const express = require('express');
const {
  createQuestion,
  getQuestions,
  getApprovedFeed,
  getQuestionById,
  moderateQuestion,
  approveQuestion,
  rejectQuestion,
  answerQuestion,
  upvoteQuestion,
  askAiAssist
} = require('../controllers/questionController');
const { authenticate, requireRole } = require('../middleware/auth');

const flexibleModerationAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, () => {
      return requireRole('organizer', 'anchor', 'ORGANIZER', 'ANCHOR')(req, res, next);
    });
  }
  if (req.body && req.body.moderatorId) {
    return next();
  }
  if (req.params.eventId) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Not authorized to access this route. Token is missing.'
  });
};

const router = express.Router({ mergeParams: true });

// Public / Audience routes
router.post('/', createQuestion);
router.get('/', getQuestions);
router.get('/approved', getApprovedFeed);
router.get('/anchor', getApprovedFeed);
router.post('/:id/upvote', upvoteQuestion);
router.get('/:id', getQuestionById);

// Moderation routes
router.patch('/:id/status', flexibleModerationAuth, moderateQuestion);
router.patch('/:id/approve', flexibleModerationAuth, approveQuestion);
router.patch('/:id/reject', flexibleModerationAuth, rejectQuestion);
router.patch('/:id/answer', flexibleModerationAuth, answerQuestion);

// AI assist on question
router.post('/:id/ai-assist', flexibleModerationAuth, askAiAssist);

module.exports = router;
