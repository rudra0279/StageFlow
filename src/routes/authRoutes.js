// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

// Invite validation and management endpoints
router.post('/validate-invite', authController.validateInvite);
router.post(
  '/invites',
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
  authController.createInvite
);
router.get(
  '/invites',
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
  authController.getInvites
);

module.exports = router;
