import mongoose from 'mongoose';
import { Question } from '../models/Question.js';
import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { QUESTION_STATUS } from '../constants/eventStatus.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { socketService } from './socketService.js';
import { generateAIScript } from './aiService.js';
import { logger } from '../utils/logger.js';

export const submitQuestion = async ({
  eventId,
  sessionId = null,
  trackId = null,
  track = null,
  question,
  text,
  authorName = 'Anonymous',
  voterId = null
}) => {
  const content = (question || text || '').trim();
  if (!content) {
    const err = new Error('Question text cannot be empty');
    err.statusCode = 400;
    throw err;
  }
  if (content.length > 500) {
    const err = new Error('Question text cannot exceed 500 characters');
    err.statusCode = 400;
    throw err;
  }

  // Validate eventId format and existence
  if (!eventId || !mongoose.isValidObjectId(eventId)) {
    const err = new Error('A valid event ID is required');
    err.statusCode = 400;
    throw err;
  }
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  // Validate sessionId if provided
  if (sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) {
      const err = new Error('Invalid session ID format');
      err.statusCode = 400;
      throw err;
    }
    const session = await Session.findOne({ _id: sessionId, eventId });
    if (!session) {
      const err = new Error('Session not found in this event');
      err.statusCode = 404;
      throw err;
    }
  }

  const resolvedTrack = trackId || track || null;

  const newQuestion = await Question.create({
    eventId,
    sessionId: sessionId || null,
    trackId: resolvedTrack ? String(resolvedTrack).trim() : null,
    question: content,
    authorName: (authorName || '').trim() || 'Anonymous',
    status: QUESTION_STATUS.PENDING,
    upvotes: 0,
    upvotedBy: voterId ? [voterId] : []
  });

  const payload = {
    question: newQuestion,
    status: 'PENDING',
    eventId,
    sessionId: newQuestion.sessionId,
    trackId: newQuestion.trackId
  };

  // Real-time broadcast to Organizers only (Anchor station must NOT receive unmoderated pending questions)
  socketService.emitToOrganizers(eventId, 'questionSubmitted', payload);
  socketService.emitToOrganizers(eventId, SOCKET_EVENTS.NEW_QUESTION, payload);

  return newQuestion;
};

export const getQuestions = async ({
  eventId,
  sessionId = null,
  trackId = null,
  track = null,
  status = null,
  sort = 'upvotes',
  sortBy = null,
  limit = 50,
  page = 1
}) => {
  const query = {};

  if (eventId) {
    if (!mongoose.isValidObjectId(eventId)) {
      const err = new Error('Invalid event ID format');
      err.statusCode = 400;
      throw err;
    }
    query.eventId = eventId;
  }

  if (sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) {
      const err = new Error('Invalid session ID format');
      err.statusCode = 400;
      throw err;
    }
    query.sessionId = sessionId;
  }

  // Strict Track Scoping
  const resolvedTrack = trackId || track || null;
  if (resolvedTrack !== null && resolvedTrack !== undefined && resolvedTrack !== '') {
    if (resolvedTrack === 'none' || resolvedTrack === 'null') {
      query.$or = [{ trackId: null }, { trackId: '' }];
    } else {
      query.trackId = String(resolvedTrack).trim();
    }
  }

  if (status && status.toUpperCase() !== 'ALL') {
    const normalizedStatus = status.toUpperCase();
    if (!Object.values(QUESTION_STATUS).includes(normalizedStatus)) {
      const err = new Error(`Invalid status filter: ${status}`);
      err.statusCode = 400;
      throw err;
    }
    query.status = normalizedStatus;
  }

  const activeSort = sortBy || sort;
  let sortOption = { upvotes: -1, createdAt: -1 };
  if (activeSort === 'newest') sortOption = { createdAt: -1 };
  if (activeSort === 'oldest') sortOption = { createdAt: 1 };

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [questions, total] = await Promise.all([
    Question.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit)
      .populate('sessionId', 'title room orderIndex')
      .populate('moderatedBy', 'name email role'),
    Question.countDocuments(query)
  ]);

  return {
    questions,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit)
  };
};

export const getApprovedFeed = async ({
  eventId,
  sessionId = null,
  trackId = null,
  track = null,
  limit = 50
}) => {
  return getQuestions({
    eventId,
    sessionId,
    trackId: trackId || track,
    status: QUESTION_STATUS.APPROVED,
    sort: 'upvotes',
    limit,
    page: 1
  });
};

export const moderateQuestion = async ({
  questionId,
  status,
  userId = null
}) => {
  if (!questionId || !mongoose.isValidObjectId(questionId)) {
    const err = new Error('Invalid question ID format');
    err.statusCode = 400;
    throw err;
  }

  const normalizedStatus = (status || '').toUpperCase();
  if (!Object.values(QUESTION_STATUS).includes(normalizedStatus)) {
    const err = new Error(`Invalid moderation status: ${status}`);
    err.statusCode = 400;
    throw err;
  }

  const question = await Question.findById(questionId);
  if (!question) {
    const err = new Error('Question not found');
    err.statusCode = 404;
    throw err;
  }

  // State Transition Validation
  if (question.status === normalizedStatus) {
    const err = new Error(`Question is already ${normalizedStatus.toLowerCase()}`);
    err.statusCode = 400;
    throw err;
  }

  if (question.status === QUESTION_STATUS.REJECTED) {
    const err = new Error('Cannot moderate an already rejected question');
    err.statusCode = 400;
    throw err;
  }

  if (question.status === QUESTION_STATUS.ANSWERED) {
    const err = new Error('Cannot moderate an already answered question');
    err.statusCode = 400;
    throw err;
  }

  // Allowed transitions:
  // PENDING -> APPROVED or REJECTED
  // APPROVED -> ANSWERED or REJECTED
  if (
    question.status === QUESTION_STATUS.PENDING &&
    ![QUESTION_STATUS.APPROVED, QUESTION_STATUS.REJECTED].includes(normalizedStatus)
  ) {
    const err = new Error(`Cannot transition directly from PENDING to ${normalizedStatus}`);
    err.statusCode = 400;
    throw err;
  }

  question.status = normalizedStatus;
  question.moderatedBy = userId || null;
  question.moderatedAt = new Date();
  if (normalizedStatus === QUESTION_STATUS.ANSWERED) {
    question.answeredAt = new Date();
  }
  await question.save();

  // Real-time dispatch according to moderation state
  if (normalizedStatus === QUESTION_STATUS.APPROVED) {
    const payload = {
      questionId: question._id,
      status: QUESTION_STATUS.APPROVED,
      question,
      eventId: question.eventId,
      sessionId: question.sessionId,
      trackId: question.trackId
    };
    socketService.emitToEvent(question.eventId, 'questionApproved', payload);
    socketService.emitToEvent(question.eventId, SOCKET_EVENTS.QUESTION_APPROVED, payload);
    socketService.emitToAnchors(question.eventId, 'questionApproved', payload);
  } else if (normalizedStatus === QUESTION_STATUS.REJECTED) {
    const payload = {
      questionId: question._id,
      status: QUESTION_STATUS.REJECTED,
      question,
      eventId: question.eventId
    };
    // Broadcast ONLY to Organizers
    socketService.emitToOrganizers(question.eventId, 'questionRejected', payload);
    socketService.emitToOrganizers(question.eventId, SOCKET_EVENTS.QUESTION_REJECTED, payload);
  } else if (normalizedStatus === QUESTION_STATUS.ANSWERED) {
    const payload = {
      questionId: question._id,
      status: QUESTION_STATUS.ANSWERED,
      question,
      eventId: question.eventId
    };
    socketService.emitToEvent(question.eventId, 'questionAnswered', payload);
    socketService.emitToEvent(question.eventId, SOCKET_EVENTS.QUESTION_ANSWERED, payload);
  }

  return question;
};

export const upvoteQuestion = async ({ questionId, voterId, allowIdempotent = false }) => {
  if (!questionId || !mongoose.isValidObjectId(questionId)) {
    const err = new Error('Invalid question ID format');
    err.statusCode = 400;
    throw err;
  }

  const question = await Question.findById(questionId).select('+upvotedBy');
  if (!question) {
    const err = new Error('Question not found');
    err.statusCode = 404;
    throw err;
  }

  if (question.status === QUESTION_STATUS.REJECTED) {
    const err = new Error('Cannot upvote a rejected question');
    err.statusCode = 400;
    throw err;
  }

  if (question.status === QUESTION_STATUS.ANSWERED) {
    const err = new Error('Cannot upvote an already answered question');
    err.statusCode = 400;
    throw err;
  }

  // Lightweight anti-abuse protection against repeated upvoting
  const identifier = String(voterId || 'anonymous').trim();
  if (question.upvotedBy && question.upvotedBy.includes(identifier)) {
    if (allowIdempotent) {
      return question;
    }
    const err = new Error('You have already upvoted this question');
    err.statusCode = 400;
    throw err;
  }

  const updated = await Question.findByIdAndUpdate(
    questionId,
    {
      $inc: { upvotes: 1 },
      $addToSet: { upvotedBy: identifier }
    },
    { new: true }
  );

  const payload = {
    questionId: updated._id,
    upvotes: updated.upvotes,
    eventId: updated.eventId,
    sessionId: updated.sessionId,
    trackId: updated.trackId
  };

  // Broadcast upvote update in real time to all in room
  socketService.emitToEvent(question.eventId, 'questionUpvoted', payload);
  socketService.emitToEvent(question.eventId, SOCKET_EVENTS.QUESTION_UPVOTED, payload);

  return updated;
};

export const getQuestionAiAssist = async ({ questionId, tone = 'direct' }) => {
  if (!questionId || !mongoose.isValidObjectId(questionId)) {
    const err = new Error('Invalid question ID format');
    err.statusCode = 400;
    throw err;
  }

  const question = await Question.findById(questionId)
    .populate('eventId', 'title theme')
    .populate('sessionId', 'title room');

  if (!question) {
    const err = new Error('Question not found');
    err.statusCode = 404;
    throw err;
  }

  const eventTitle = question.eventId?.title || 'Live Conference';
  const sessionTitle = question.sessionId?.title || 'Stage Session';

  const prompt = `You are the StagePilot Backstage AI Co-Pilot assisting a live stage anchor.
An audience member asked the following question during the session "${sessionTitle}" at "${eventTitle}":
"${question.question}"

Provide a concise, highly engaging 2-3 bullet point answer and bridge that the anchor can read or summarize directly to the audience.
Keep your response professional, insightful, and under 75 words.`;

  const result = await generateAIScript({
    eventId: question.eventId?._id || question.eventId,
    sessionId: question.sessionId?._id || question.sessionId,
    scriptType: 'copilot',
    prompt,
    contextData: {
      eventTitle,
      sessionTitle,
      question: question.question,
      authorName: question.authorName
    },
    tone
  });

  question.aiAnswerSuggestion = result.script;
  await question.save();

  return {
    questionId: question._id,
    question: question.question,
    aiAnswerSuggestion: result.script,
    provider: result.provider
  };
};
