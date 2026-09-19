import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getCurrentUser);

export default router;
