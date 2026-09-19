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

/**
 * Normalise track field: tests use 'track', schema uses 'trackId'.
 * Returns undefined if not provided (preserves null-filter logic).
 */
function resolveTrack(track, trackId) {
  const raw = track || trackId;
  if (raw === undefined || raw === null || raw === '') return null;
  return String(raw).trim();
}

/**
 * Serialise a question document adding virtual fields expected by tests:
 *   - track (alias for trackId)
 *   - isAnswered
 *   - answeredAt
 *   - upvoters (alias for upvotedBy array)
 */
function serializeQuestion(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  delete obj.save;
  obj.track = obj.trackId || obj.track || null;
  obj.trackId = obj.trackId || obj.track || null;
  obj.upvoters = obj.upvotedBy || obj.upvoters || [];
  obj.upvotedBy = obj.upvoters;
  obj.isAnswered = obj.status === QUESTION_STATUS.ANSWERED;
  if (obj.isAnswered && !obj.answeredAt) {
    obj.answeredAt = obj.moderatedAt || obj.updatedAt || null;
  }
  return obj;
}

function broadcastQuestionEvent(eventName, questionDoc, options = {}) {
  try {
    const { getIO } = require('../socket/socketServer');
    const io = getIO();
    if (!io) return;
    const qData = serializeQuestion(questionDoc);

    const eventId = qData.eventId ? qData.eventId.toString() : '';
    const track = qData.track || qData.trackId || null;

    const payload = {
      question: qData,
      questionId: qData._id,
      status: qData.status,
      isAnswered: qData.isAnswered,
      upvotes: qData.upvotes,
      track: track,
      eventId: eventId
    };

    const mainRoom = `event:${eventId}`;
    const legacyMain = `event_${eventId}`;
    const orgRoom = `event_${eventId}_organizers`;
    const orgRoom2 = `event:${eventId}:organizers`;
    const orgRoom3 = `event_${eventId}:organizers`;
    const anchorRoom = `event_${eventId}_anchors`;
    const anchorRoom2 = `event:${eventId}:anchors`;
    const anchorRoom3 = `event_${eventId}:anchors`;

    if (eventName === 'questionSubmitted' || options.organizerOnly) {
      io.to(orgRoom).to(orgRoom2).to(orgRoom3).emit(eventName, payload);
    } else if (eventName === 'questionApproved') {
      let emitter = io.to(mainRoom).to(legacyMain).to(orgRoom).to(orgRoom2).to(anchorRoom).to(anchorRoom2);
      if (track) {
        emitter = emitter.to(`event_${eventId}_anchors_${track}`).to(`event:${eventId}:anchors:${track}`).to(`event_${eventId}:track:${track}`);
      }
      emitter.emit(eventName, payload);
    } else if (eventName === 'questionRejected') {
      io.to(orgRoom).to(orgRoom2).to(orgRoom3).emit(eventName, payload);
    } else if (eventName === 'questionUpvoted') {
      let emitter = io.to(mainRoom).to(legacyMain).to(orgRoom).to(orgRoom2).to(anchorRoom).to(anchorRoom2);
      if (track) {
        emitter = emitter.to(`event_${eventId}_anchors_${track}`).to(`event:${eventId}:anchors:${track}`).to(`event_${eventId}:track:${track}`);
      }
      emitter.emit(eventName, payload);
    } else if (eventName === 'questionAnswered') {
      let emitter = io.to(mainRoom).to(legacyMain).to(orgRoom).to(orgRoom2).to(anchorRoom).to(anchorRoom2);
      if (track) {
        emitter = emitter.to(`event_${eventId}_anchors_${track}`).to(`event:${eventId}:anchors:${track}`).to(`event_${eventId}:track:${track}`);
      }
      emitter.emit(eventName, payload);
    }
  } catch (err) {
    // Socket emit failure ignored
  }
}

/** Safe non-crashing socket emit — silently skips if socket not initialized */
function emitToEvent(eventId, eventName, payload, options = {}) {
  try {
    const { getIO } = require('../socket/socketServer');
    const { getEventRoom } = require('../socket/socketEvents');
    const io = getIO();
    const mainRoom = getEventRoom(eventId);
    if (options.organizerOnly) {
      io.to(`${mainRoom}:organizers`).emit(eventName, payload);
    } else if (options.anchorOnly) {
      io.to(`${mainRoom}:anchors`).emit(eventName, payload);
    } else {
      io.to(mainRoom).emit(eventName, payload);
    }
  } catch (_) { /* Socket.IO not initialized in test — non-fatal */ }
}

// ─────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────
async function createQuestion(req, res, next) {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const { sessionId, trackId, track, question, text, authorName, voterId: bodyVoterId } = req.body;
    const voterId = bodyVoterId || req.user?._id?.toString() || null;

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

    if (authorName && typeof authorName === 'string' && authorName.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Author name cannot exceed 100 characters' });
    }

    const resolvedTrack = resolveTrack(track, trackId);
    if (resolvedTrack && resolvedTrack.length > 100) {
      return res.status(400).json({ success: false, message: 'Track identifier cannot exceed 100 characters' });
    }

    const newQ = await Question.create({
      eventId,
      sessionId: sessionId || null,
      trackId: resolvedTrack,
      track: resolvedTrack,
      question: content,
      authorName: (authorName || '').trim() || 'Anonymous',
      status: QUESTION_STATUS.PENDING,
      upvotes: 0,
      upvotedBy: voterId ? [voterId] : [],
      upvoters: voterId ? [voterId] : [],
      isAnswered: false,
      answeredAt: null
    });

    broadcastQuestionEvent('questionSubmitted', newQ, { organizerOnly: true });

    res.status(201).json({
      success: true,
      message: 'Question submitted successfully',
      data: serializeQuestion(newQ)
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────
// READ — filtered question list
// ─────────────────────────────────────────────────────────
async function getQuestions(req, res, next) {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { sessionId, trackId, track, status, sortBy, sort = sortBy || 'upvotes' } = req.query;
    const targetTrack = trackId || track;

    const filter = {};
    if (eventId) filter.eventId = eventId;
    if (sessionId) filter.sessionId = sessionId;

    if (targetTrack !== undefined && targetTrack !== null && targetTrack !== '') {
      if (targetTrack === 'none' || targetTrack === 'null') {
        filter.trackId = null;
      } else {
        filter.trackId = String(targetTrack).trim();
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

    // Post-process track filtering (handles both 'track' and 'trackId' query params)
    const resolvedTrack = resolveTrack(track, trackId);
    if (resolvedTrack) {
      questions = questions.filter(q => {
        const qTrack = q.track || q.trackId || null;
        return qTrack && qTrack.toString() === resolvedTrack;
      });
    }

    if (sort === 'upvotes' || sortBy === 'upvotes') {
      questions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (sort === 'newest') {
      questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      questions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions.map(serializeQuestion)
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────
// READ — approved feed (legacy, sorted by upvotes)
// ─────────────────────────────────────────────────────────
async function getApprovedFeed(req, res, next) {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { sessionId, trackId, track } = req.query;
    const targetTrack = trackId || track;

    const filter = { status: QUESTION_STATUS.APPROVED };
    if (eventId) filter.eventId = eventId;
    if (sessionId) filter.sessionId = sessionId;

    if (targetTrack !== undefined && targetTrack !== null && targetTrack !== '') {
      if (targetTrack === 'none' || targetTrack === 'null') {
        filter.trackId = null;
      } else {
        filter.trackId = String(targetTrack).trim();
      }
    }

    let questions = await Question.find(filter);

    const resolvedTrack = resolveTrack(track, trackId);
    if (resolvedTrack) {
      questions = questions.filter(q => {
        const qTrack = q.track || q.trackId || null;
        return qTrack && qTrack.toString() === resolvedTrack;
      });
    }

    questions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions.map(serializeQuestion)
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────
// READ — anchor station feed (approved only, filtered by track)
// Matches GET /api/events/:eventId/questions/anchor?track=Track+A
// ─────────────────────────────────────────────────────────
async function getAnchorFeed(req, res, next) {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { track, trackId } = req.query;

    const filter = { status: QUESTION_STATUS.APPROVED };
    if (eventId) filter.eventId = eventId;

    let questions = await Question.find(filter);

    const resolvedTrack = resolveTrack(track, trackId);
    if (resolvedTrack) {
      questions = questions.filter(q => {
        const qTrack = q.track || q.trackId || null;
        return qTrack && qTrack.toString() === resolvedTrack;
      });
    }

    questions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions.map(serializeQuestion)
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────
// READ — single question
// ─────────────────────────────────────────────────────────
async function getQuestionById(req, res, next) {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, data: serializeQuestion(q) });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────
// MODERATE — core state machine
// ─────────────────────────────────────────────────────────
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
    question.moderatedBy = req.user?._id || req.body.moderatorId || null;
    question.moderatedAt = new Date();

    if (status === QUESTION_STATUS.ANSWERED) {
      question.isAnswered = true;
      question.answeredAt = new Date();
    }

    await question.save();

    const serialized = serializeQuestion(question);

    if (status === QUESTION_STATUS.APPROVED) {
      broadcastQuestionEvent('questionApproved', question);
    } else if (status === QUESTION_STATUS.REJECTED) {
      broadcastQuestionEvent('questionRejected', question, { organizerOnly: true });
    } else if (status === QUESTION_STATUS.ANSWERED) {
      broadcastQuestionEvent('questionAnswered', question);
    }

    res.status(200).json({
      success: true,
      message: `Question status updated to ${status}`,
      data: serialized
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

// ─────────────────────────────────────────────────────────
// UPVOTE
// ─────────────────────────────────────────────────────────
async function upvoteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const voterId = req.body.voterId ||
      req.user?._id?.toString() ||
      req.headers['x-client-id'] ||
      req.ip ||
      'anon_voter';

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

    // Check both upvotedBy and upvoters (field aliases)
    const existingVoters = [...(question.upvotedBy || []), ...(question.upvoters || [])];
    if (existingVoters.includes(voterId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already upvoted this question',
        data: serializeQuestion(question)
      });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: voterId, upvoters: voterId }
      },
      { new: true }
    );

    const serialized = serializeQuestion(updated);
    broadcastQuestionEvent('questionUpvoted', updated);

    res.status(200).json({
      success: true,
      message: 'Question upvoted successfully',
      data: serialized
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────
// AI ASSIST (per-question)
// ─────────────────────────────────────────────────────────
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
      userQuery: `Answer this live audience question: "${question.question}"`,
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
  getAnchorFeed,
  getQuestionById,
  moderateQuestion,
  approveQuestion,
  rejectQuestion,
  answerQuestion,
  upvoteQuestion,
  askAiAssist
};
