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

const router = express.Router({ mergeParams: true });

const moderationAuth = [
  authenticate,
  requireRole('organizer', 'anchor', 'ORGANIZER', 'ANCHOR')
];

// Public / Audience routes
router.post('/', createQuestion);
router.get('/', getQuestions);
router.get('/approved', getApprovedFeed);
router.post('/:id/upvote', upvoteQuestion);
router.get('/:id', getQuestionById);

// Moderation routes
router.patch('/:id/status', ...moderationAuth, moderateQuestion);
router.patch('/:id/approve', ...moderationAuth, approveQuestion);
router.patch('/:id/reject', ...moderationAuth, rejectQuestion);
router.patch('/:id/answer', ...moderationAuth, answerQuestion);

// AI assist on question
router.post('/:id/ai-assist', ...moderationAuth, askAiAssist);

module.exports = router;
