// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const chatController = require('../controllers/chatController');
const { authenticate, requireRole } = require('../middleware/auth');

const organizerAuth = [
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
];

router.get('/', ...organizerAuth, chatController.getChatHistory);
router.post('/', ...organizerAuth, chatController.sendMessage);

module.exports = router;
