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

function broadcastQuestionEvent(eventName, questionDoc) {
  try {
    const { getIO } = require('../socket/socketServer');
    const io = getIO();
    if (!io) return;
    const qData = questionDoc.toJSON ? questionDoc.toJSON() : { ...questionDoc };
    qData.isAnswered = qData.status === 'ANSWERED';
    if (!qData.track && qData.trackId) qData.track = qData.trackId;
    if (!qData.trackId && qData.track) qData.trackId = qData.track;

    const eventId = qData.eventId ? qData.eventId.toString() : '';
    const track = qData.track || qData.trackId || 'Track A';

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
    const anchorRoom = `event_${eventId}_anchors`;
    const anchorRoom2 = `event:${eventId}:anchors`;
    const trackRoom = `event_${eventId}_anchors_${track}`;
    const trackRoom2 = `event:${eventId}:anchors:${track}`;

    if (eventName === 'questionSubmitted') {
      io.to(orgRoom).to(orgRoom2).emit('questionSubmitted', payload);
    } else if (eventName === 'questionApproved') {
      io.to(mainRoom).to(legacyMain).to(orgRoom).to(orgRoom2).to(anchorRoom).to(anchorRoom2).to(trackRoom).to(trackRoom2).emit('questionApproved', payload);
    } else if (eventName === 'questionRejected') {
      io.to(orgRoom).to(orgRoom2).emit('questionRejected', payload);
    } else if (eventName === 'questionUpvoted') {
      io.to(mainRoom).to(legacyMain).to(orgRoom).to(orgRoom2).to(anchorRoom).to(anchorRoom2).to(trackRoom).to(trackRoom2).emit('questionUpvoted', payload);
    } else if (eventName === 'questionAnswered') {
      io.to(mainRoom).to(legacyMain).to(orgRoom).to(orgRoom2).to(anchorRoom).to(anchorRoom2).to(trackRoom).to(trackRoom2).emit('questionAnswered', payload);
    }
  } catch (err) {
    // Socket emit failure ignored
  }
}

async function createQuestion(req, res, next) {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const { sessionId, trackId, track, question, text, authorName } = req.body;
    const rawTrack = trackId || track || null;

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
      trackId: rawTrack ? String(rawTrack).trim() : null,
      track: rawTrack ? String(rawTrack).trim() : null,
      question: content,
      authorName: (authorName || '').trim() || 'Anonymous',
      status: QUESTION_STATUS.PENDING,
      upvotes: 0,
      upvotedBy: [voterId],
      isAnswered: false,
    });

    broadcastQuestionEvent('questionSubmitted', newQ);

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
    const { sessionId, trackId, track, status, sort = 'upvotes' } = req.query;
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
    question.isAnswered = status === QUESTION_STATUS.ANSWERED;
    if (status === QUESTION_STATUS.ANSWERED) {
      question.answeredAt = new Date();
    }
    question.moderatedBy = req.user?._id || null;
    question.moderatedAt = new Date();
    await question.save();

    if (status === QUESTION_STATUS.APPROVED) {
      broadcastQuestionEvent('questionApproved', question);
    } else if (status === QUESTION_STATUS.REJECTED) {
      broadcastQuestionEvent('questionRejected', question);
    } else if (status === QUESTION_STATUS.ANSWERED) {
      broadcastQuestionEvent('questionAnswered', question);
    }

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
    const voterId = req.user?._id?.toString() || req.body.voterId || req.headers['x-client-id'] || req.ip || 'anon_voter';

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
      return res.status(400).json({
        success: false,
        message: 'You have already upvoted this question',
        data: question
      });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: voterId }
      },
      { new: true }
    );

    broadcastQuestionEvent('questionUpvoted', updated);

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
