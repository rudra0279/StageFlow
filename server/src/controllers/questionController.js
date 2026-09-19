import {
  submitQuestion,
  getQuestions,
  getApprovedFeed,
  moderateQuestion,
  upvoteQuestion,
  getQuestionAiAssist
} from '../services/questionService.js';
import { Question } from '../models/Question.js';
import { QUESTION_STATUS } from '../constants/eventStatus.js';

export const createQuestion = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const { sessionId, trackId, question, text, authorName } = req.body;

    const voterId =
      req.user?._id?.toString() ||
      req.headers['x-client-id'] ||
      req.ip ||
      req.socket.remoteAddress ||
      'anonymous_client';

    const newQuestion = await submitQuestion({
      eventId,
      sessionId,
      trackId,
      question,
      text,
      authorName: authorName || req.user?.name,
      voterId
    });

    res.status(201).json({
      success: true,
      message: 'Question submitted successfully and placed in moderation queue',
      data: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

export const listQuestions = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { sessionId, trackId, status, sort, page, limit } = req.query;

    const result = await getQuestions({
      eventId,
      sessionId,
      trackId,
      status,
      sort,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      count: result.questions.length,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovedFeedEndpoint = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.query.eventId;
    const { sessionId, trackId, limit } = req.query;

    const result = await getApprovedFeed({
      eventId,
      sessionId,
      trackId,
      limit
    });

    res.status(200).json({
      success: true,
      count: result.questions.length,
      data: result.questions
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('sessionId', 'title room orderIndex')
      .populate('moderatedBy', 'name email role');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

export const moderateQuestionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await moderateQuestion({
      questionId: id,
      status,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: `Question status updated to ${updated.status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const approveQuestion = async (req, res, next) => {
  try {
    const updated = await moderateQuestion({
      questionId: req.params.id,
      status: QUESTION_STATUS.APPROVED,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'Question approved and published to live anchor feed',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const rejectQuestion = async (req, res, next) => {
  try {
    const updated = await moderateQuestion({
      questionId: req.params.id,
      status: QUESTION_STATUS.REJECTED,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'Question rejected',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const answerQuestion = async (req, res, next) => {
  try {
    const updated = await moderateQuestion({
      questionId: req.params.id,
      status: QUESTION_STATUS.ANSWERED,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'Question marked as answered on stage',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const upvoteQuestionEndpoint = async (req, res, next) => {
  try {
    const voterId =
      req.user?._id?.toString() ||
      req.headers['x-client-id'] ||
      req.ip ||
      req.socket.remoteAddress ||
      'anonymous_voter';

    const updated = await upvoteQuestion({
      questionId: req.params.id,
      voterId
    });

    res.status(200).json({
      success: true,
      message: 'Question upvoted successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const askAiAssistForQuestion = async (req, res, next) => {
  try {
    const { tone } = req.body;
    const result = await getQuestionAiAssist({
      questionId: req.params.id,
      tone: tone || 'direct'
    });

    res.status(200).json({
      success: true,
      message: 'AI Co-Pilot generated anchor stage talking points for question',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
