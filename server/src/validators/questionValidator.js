import Joi from 'joi';
import { QUESTION_STATUS } from '../constants/eventStatus.js';

export const createQuestionSchema = Joi.object({
  eventId: Joi.string().hex().length(24).optional(),
  sessionId: Joi.string().hex().length(24).allow(null, '').optional(),
  trackId: Joi.string().trim().max(100).allow(null, '').optional(),
  track: Joi.string().trim().max(100).allow(null, '').optional(),
  question: Joi.string().trim().min(3).max(500).optional(),
  text: Joi.string().trim().min(3).max(500).optional(),
  authorName: Joi.string().trim().max(100).allow('').optional(),
  voterId: Joi.string().trim().optional()
}).or('question', 'text').unknown(true);

export const moderateQuestionSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(QUESTION_STATUS))
    .insensitive()
    .required(),
  moderatorId: Joi.string().optional()
}).unknown(true);

export const queryQuestionsSchema = Joi.object({
  eventId: Joi.string().hex().length(24).optional(),
  sessionId: Joi.string().hex().length(24).allow(null, '').optional(),
  trackId: Joi.string().trim().max(100).allow(null, '').optional(),
  track: Joi.string().trim().max(100).allow(null, '').optional(),
  status: Joi.string().valid(...Object.values(QUESTION_STATUS), 'ALL', 'all').insensitive().optional(),
  sort: Joi.string().valid('upvotes', 'newest', 'oldest').default('upvotes'),
  sortBy: Joi.string().valid('upvotes', 'newest', 'oldest').optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  page: Joi.number().integer().min(1).default(1)
}).unknown(true);
