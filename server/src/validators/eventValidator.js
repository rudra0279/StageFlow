import Joi from 'joi';

export const createEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().allow('').optional(),
  date: Joi.date().iso().required(),
  venue: Joi.string().allow('').default('Main Stage'),
  theme: Joi.string().allow('').default('Tech & Innovation'),
  workAreas: Joi.array().items(Joi.string()).optional()
});

export const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().allow('').optional(),
  date: Joi.date().iso().optional(),
  venue: Joi.string().allow('').optional(),
  theme: Joi.string().allow('').optional(),
  status: Joi.string().valid('DRAFT', 'LIVE', 'PAUSED', 'COMPLETED').optional(),
  currentSessionId: Joi.string().hex().length(24).allow(null).optional()
});
