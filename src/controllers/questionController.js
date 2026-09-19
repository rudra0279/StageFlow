// src/controllers/questionController.js
const Question = require('../models/Question');
const Event = require('../models/Event');
const Agenda = require('../models/Agenda');
const { generateScript } = require('../services/ai/aiService');

const QUESTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ANSWERED: 'ANSWERED'
};

async function createQuestion(req, res, next) {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const { sessionId, trackId, question, text, authorName } = req.body;

    const content = (question || text || '').trim();
    if (!content) {
      return res.status(400).json({ success: false, message: 'Question text cannot be empty' });
    }
    if (content.length > 500) {
      return res.status(400).json({ success: false, message: 'Question text cannot exceed 500 characters' });
    }

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (sessionId) {
      const session = await Agenda.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found for this event' });
      }
    }

    const voterId = req.user?._id?.toString() || req.headers['x-client-id'] || req.ip || 'anon_client';

    const newQ = await Question.create({
      eventId,
      sessionId: sessionId || null,
      trackId: trackId ? String(trackId).trim() : null,
      question: content,
      authorName: (authorName || '').trim() || 'Anonymous',
      status: QUESTION_STATUS.PENDING,
      upvotes: 0,
      upvotedBy: [voterId]
    });

    res.status(201).json({
      success: true,
      message: 'Question submitted successfully',
      data: newQ
    });
  } catch (error) {
    next(error);
  }
}

async function getQuestions(req, res, next) {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { sessionId, trackId, status, sort = 'upvotes' } = req.query;

    const filter = {};
    if (eventId) filter.eventId = eventId;
    if (sessionId) filter.sessionId = sessionId;
    if (trackId !== undefined && trackId !== null && trackId !== '') {
      if (trackId === 'none' || trackId === 'null') {
        filter.trackId = null;
      } else {
        filter.trackId = String(trackId).trim();
      }
    }
    if (status && status.toUpperCase() !== 'ALL') {
      const normStatus = status.toUpperCase();
      if (!Object.values(QUESTION_STATUS).includes(normStatus)) {
        return res.status(400).json({ success: false, message: `Invalid status filter: ${status}` });
      }
      filter.status = normStatus;
    }

    let questions = await Question.find(filter);

    if (sort === 'upvotes') {
      questions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (sort === 'newest') {
      questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      questions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
}

async function getApprovedFeed(req, res, next) {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { sessionId, trackId } = req.query;

    const filter = { status: QUESTION_STATUS.APPROVED };
    if (eventId) filter.eventId = eventId;
    if (sessionId) filter.sessionId = sessionId;
    if (trackId !== undefined && trackId !== null && trackId !== '') {
      if (trackId === 'none' || trackId === 'null') {
        filter.trackId = null;
      } else {
        filter.trackId = String(trackId).trim();
      }
    }

    let questions = await Question.find(filter);
    questions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
}

async function getQuestionById(req, res, next) {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, data: q });
  } catch (error) {
    next(error);
  }
}

async function moderateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const status = (req.body.status || '').toUpperCase();

    if (!Object.values(QUESTION_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid moderation status: ${req.body.status}` });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (question.status === status) {
      return res.status(400).json({ success: false, message: `Question is already ${status.toLowerCase()}` });
    }

    if (question.status === QUESTION_STATUS.REJECTED) {
      return res.status(400).json({ success: false, message: 'Cannot moderate an already rejected question' });
    }

    if (question.status === QUESTION_STATUS.ANSWERED) {
      return res.status(400).json({ success: false, message: 'Cannot moderate an already answered question' });
    }

    if (
      question.status === QUESTION_STATUS.PENDING &&
      ![QUESTION_STATUS.APPROVED, QUESTION_STATUS.REJECTED].includes(status)
    ) {
      return res.status(400).json({ success: false, message: `Cannot transition directly from PENDING to ${status}` });
    }

    question.status = status;
    question.moderatedBy = req.user?._id || null;
    question.moderatedAt = new Date();
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question status updated to ${status}`,
      data: question
    });
  } catch (error) {
    next(error);
  }
}

async function approveQuestion(req, res, next) {
  req.body.status = QUESTION_STATUS.APPROVED;
  return moderateQuestion(req, res, next);
}

async function rejectQuestion(req, res, next) {
  req.body.status = QUESTION_STATUS.REJECTED;
  return moderateQuestion(req, res, next);
}

async function answerQuestion(req, res, next) {
  req.body.status = QUESTION_STATUS.ANSWERED;
  return moderateQuestion(req, res, next);
}

async function upvoteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const voterId = req.user?._id?.toString() || req.headers['x-client-id'] || req.ip || 'anon_voter';

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (question.status === QUESTION_STATUS.REJECTED) {
      return res.status(400).json({ success: false, message: 'Cannot upvote a rejected question' });
    }

    if (question.status === QUESTION_STATUS.ANSWERED) {
      return res.status(400).json({ success: false, message: 'Cannot upvote an already answered question' });
    }

    if (question.upvotedBy && question.upvotedBy.includes(voterId)) {
      return res.status(400).json({ success: false, message: 'You have already upvoted this question' });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: voterId }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Question upvoted successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function askAiAssist(req, res, next) {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const event = await Event.findById(question.eventId);
    const result = await generateScript('assistant', {
      eventName: event?.name || 'Live Event',
      command: `Answer this live audience question: "${question.question}"`,
      question: question.question,
      authorName: question.authorName
    });

    question.aiAnswerSuggestion = result.script || result.response;
    await question.save();

    res.status(200).json({
      success: true,
      message: 'AI assistant generated guidance for question',
      data: {
        questionId: question._id,
        question: question.question,
        aiAnswerSuggestion: question.aiAnswerSuggestion,
        provider: result.provider
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
