// src/routes/questionRoutes.js
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

const router = express.Router({ mergeParams: true });

// Public / Audience routes
router.post('/', createQuestion);
router.get('/', getQuestions);
router.get('/approved', getApprovedFeed);
router.get('/anchor', getAnchorFeed || getApprovedFeed);
router.post('/:id/upvote', upvoteQuestion);
router.get('/:id', getQuestionById);

// Moderation routes
router.patch('/:id/status', moderateQuestion);
router.patch('/:id/approve', approveQuestion);
router.patch('/:id/reject', rejectQuestion);
router.patch('/:id/answer', answerQuestion);

// AI assist on question
router.post('/:id/ai-assist', askAiAssist);

module.exports = router;
