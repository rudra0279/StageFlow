// src/routes/speakerRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const speakerController = require('../controllers/speakerController');
const { authenticate } = require('../middleware/auth');

// Can be mounted under /api/events/:eventId/speakers or /api/speakers
router.route('/')
  .post(authenticate, speakerController.createSpeaker)
  .get(speakerController.getSpeakers);

router.route('/:id')
  .get(speakerController.getSpeakerById)
  .put(authenticate, speakerController.updateSpeaker)
  .delete(authenticate, speakerController.deleteSpeaker);

module.exports = router;
