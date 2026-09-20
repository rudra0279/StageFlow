// src/routes/sessionRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

router.post('/:agendaId/start', authenticate, sessionController.handleStartSession);
router.post('/:agendaId/complete', authenticate, sessionController.handleCompleteSession);
router.post('/:agendaId/skip', authenticate, sessionController.handleSkipSession);
router.post('/:agendaId/delay', authenticate, sessionController.handleDelaySession);

module.exports = router;
