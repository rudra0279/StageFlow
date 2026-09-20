// src/routes/questionRoutesAuth.js
// Auth-protected question routes for /api/questions flat mount
const express = require('express');
const {
  createQuestion,
  getQuestions,
  getApprovedFeed,
  getAnchorFeed,
  getQuestionById,
  moderateQuestion,
  approveQuestion,
  rejectQuestion,
  answerQuestion,
  upvoteQuestion,
  askAiAssist
} = require('../controllers/questionController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

const moderationAuth = [
  authenticate,
  requireRole('organizer', 'anchor', 'ORGANIZER', 'ANCHOR')
];

// Public / Audience routes
router.post('/', createQuestion);
router.get('/', getQuestions);
router.get('/approved', getApprovedFeed);
router.get('/anchor', getAnchorFeed);
router.post('/:id/upvote', upvoteQuestion);
router.get('/:id', getQuestionById);

// Auth-protected Moderation routes (supporting both PATCH and POST)
router.patch('/:id/status', ...moderationAuth, moderateQuestion);
router.patch('/:id/approve', ...moderationAuth, approveQuestion);
router.post('/:id/approve', ...moderationAuth, approveQuestion);
router.patch('/:id/reject', ...moderationAuth, rejectQuestion);
router.post('/:id/reject', ...moderationAuth, rejectQuestion);
router.patch('/:id/answer', ...moderationAuth, answerQuestion);
router.post('/:id/answer', ...moderationAuth, answerQuestion);

// AI assist on question (auth required)
router.post('/:id/ai-assist', ...moderationAuth, askAiAssist);

module.exports = router;
