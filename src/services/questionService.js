// src/services/questionService.js
const Question = require('../models/Question');
const socketEmitter = require('../socket/socketEmitter');
const { logger } = require('../utils/logger');

const questionService = {
  /**
   * Submit a new audience question
   * Initial state: PENDING
   */
  submitQuestion: async ({ eventId, sessionId = null, track = 'Main Stage', question, authorName = 'Anonymous Attendee', voterId = null }) => {
    if (!eventId) {
      const error = new Error('Event ID is required');
      error.statusCode = 400;
      throw error;
    }
    if (!question || !question.trim()) {
      const error = new Error('Question text is required');
      error.statusCode = 400;
      throw error;
    }

    const newQuestion = await Question.create({
      eventId,
      sessionId: sessionId || null,
      track: track ? track.trim() : 'Main Stage',
      question: question.trim(),
      authorName: authorName && authorName.trim() ? authorName.trim() : 'Anonymous Attendee',
      status: 'PENDING',
      upvotes: 0,
      upvoters: [],
      isAnswered: false,
    });

    logger.info(`[Q&A] Question submitted: ${newQuestion._id} for event ${eventId} (track: ${newQuestion.track})`);

    // Emit to organizers only
    socketEmitter.emitQuestionSubmitted(eventId, newQuestion);

    return newQuestion;
  },

  /**
   * Organizer approves a question
   * State changes to APPROVED, immediately broadcast to Anchor Station
   */
  approveQuestion: async (questionId, moderatorId = null) => {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    question.status = 'APPROVED';
    question.moderatedBy = moderatorId;
    question.moderatedAt = new Date();
    await question.save();

    logger.info(`[Q&A] Question approved: ${questionId} by moderator ${moderatorId || 'system'}`);

    // Broadcast to Anchor Station and general rooms
    socketEmitter.emitQuestionApproved(question.eventId, question);

    return question;
  },

  /**
   * Organizer rejects a question
   * State changes to REJECTED, NEVER appears on Anchor Station
   */
  rejectQuestion: async (questionId, moderatorId = null) => {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    question.status = 'REJECTED';
    question.moderatedBy = moderatorId;
    question.moderatedAt = new Date();
    await question.save();

    logger.info(`[Q&A] Question rejected: ${questionId} by moderator ${moderatorId || 'system'}`);

    // Broadcast ONLY to organizers
    socketEmitter.emitQuestionRejected(question.eventId, question);

    return question;
  },

  /**
   * Upvote a question
   * Increments upvotes and prevents duplicate votes if voterId provided
   */
  upvoteQuestion: async (questionId, voterId = null) => {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    const voter = voterId ? voterId.toString() : null;
    const upvoters = Array.isArray(question.upvoters) ? question.upvoters : [];

    if (voter && upvoters.includes(voter)) {
      // Already upvoted by this user; return existing without duplicate
      return question;
    }

    if (voter) {
      question.upvoters = [...upvoters, voter];
    }
    question.upvotes = (question.upvotes || 0) + 1;
    await question.save();

    logger.info(`[Q&A] Question upvoted: ${questionId}, new total: ${question.upvotes}`);

    // Broadcast real-time tally update
    socketEmitter.emitQuestionUpvoted(question.eventId, question);

    return question;
  },

  /**
   * Anchor marks a question as answered
   * State changes to ANSWERED, isAnswered: true
   */
  answerQuestion: async (questionId) => {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    question.status = 'ANSWERED';
    question.isAnswered = true;
    question.answeredAt = new Date();
    await question.save();

    logger.info(`[Q&A] Question marked answered: ${questionId}`);

    // Broadcast status change
    socketEmitter.emitQuestionAnswered(question.eventId, question);

    return question;
  },

  /**
   * Get all questions for an event with flexible filtering
   */
  getQuestions: async (eventId, filters = {}) => {
    const query = { eventId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.track && filters.track !== 'all') {
      query.track = filters.track;
    }

    if (filters.sessionId) {
      query.sessionId = filters.sessionId;
    }

    let sort = { upvotes: -1, createdAt: -1 };
    if (filters.sortBy === 'recent' || filters.sortBy === 'time') {
      sort = { createdAt: -1 };
    } else if (filters.sortBy === 'oldest') {
      sort = { createdAt: 1 };
    }

    const questions = await Question.find(query).sort(sort);
    return questions;
  },

  /**
   * Get approved questions for anchor view, filtered by active track
   */
  getApprovedQuestionsForAnchor: async (eventId, track = null) => {
    const query = {
      eventId,
      status: 'APPROVED',
    };

    const questions = await Question.find(query).sort({ upvotes: -1, createdAt: -1 });

    if (!track || track === 'all') {
      return questions;
    }

    // Filter by anchor's track or universal tracks
    return questions.filter((q) => {
      if (!q.track) return true;
      if (q.track === track) return true;
      if (q.track === 'Main Stage' || q.track === 'Global' || q.track === 'All Tracks') return true;
      return false;
    });
  },

  /**
   * Get question by ID
   */
  getQuestionById: async (questionId) => {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }
    return question;
  },
};

module.exports = questionService;
