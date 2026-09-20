// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// Validate AI prompt size limit
const validateAiLength = (req, res, next) => {
  const text = req.body.query || req.body.prompt || req.body.message || '';
  if (typeof text === 'string' && text.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'AI prompt is too large. Maximum allowed size is 2000 characters.'
    });
  }
  next();
};

router.use(validateAiLength);

router.post('/opening', aiController.handleOpening);
router.post('/introduction', aiController.handleIntroduction);
router.post('/transition', aiController.handleTransition);
router.post('/closing', aiController.handleClosing);
router.post('/announcement', aiController.handleAnnouncement);
router.post('/filler', aiController.handleFiller);
router.post('/emergency', aiController.handleEmergency);
router.post('/teleprompter-assist', aiController.handleTeleprompterAssist);
router.post('/assistant', aiController.handleAssistant);
router.post('/question-assist', aiController.handleQuestionAssist);

module.exports = router;
