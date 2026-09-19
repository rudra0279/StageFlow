import Joi from 'joi';

export const createSessionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required(),
  description: Joi.string().allow('').optional(),
  speakerId: Joi.string().hex().length(24).allow(null, '').optional(),
  orderIndex: Joi.number().integer().min(0).default(0),
  scheduledStartTime: Joi.date().iso().required(),
  durationMinutes: Joi.number().integer().min(1).max(360).required(),
  stageNotes: Joi.string().allow('').optional()
});

export const triggerDelaySchema = Joi.object({
  delayMinutes: Joi.number().integer().valid(5, 10, 15, 20, 30).required(),
  reason: Joi.string().trim().max(200).default('Speaker preparation delay')
});

export const broadcastAlertSchema = Joi.object({
  message: Joi.string().trim().min(3).max(250).required(),
  urgency: Joi.string().valid('LOW', 'MEDIUM', 'CRITICAL').default('MEDIUM'),
  type: Joi.string().valid('DELAY', 'EMERGENCY', 'STAGE_DIRECTION', 'GENERAL').default('GENERAL')
});
