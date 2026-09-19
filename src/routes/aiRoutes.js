// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// Note: can be open or protected; supporting both or authenticating if token is provided.
// To allow flexible testing from both anchor dashboard and organizer, authenticate or optional
router.post('/opening', aiController.handleOpening);
router.post('/introduction', aiController.handleIntroduction);
router.post('/transition', aiController.handleTransition);
router.post('/closing', aiController.handleClosing);
router.post('/announcement', aiController.handleAnnouncement);
router.post('/filler', aiController.handleFiller);
router.post('/emergency', aiController.handleEmergency);
router.post('/teleprompter-assist', aiController.handleTeleprompterAssist);
router.post('/assistant', aiController.handleAssistant);

module.exports = router;

