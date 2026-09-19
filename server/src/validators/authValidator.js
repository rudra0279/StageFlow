import Joi from 'joi';
import { ROLES } from '../constants/roles.js';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.ANCHOR),
  avatarUrl: Joi.string().uri().allow('').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
