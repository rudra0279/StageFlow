// src/routes/announcementRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const announcementController = require('../controllers/announcementController');
const { authenticate } = require('../middleware/auth');

router.route('/')
  .post(authenticate, announcementController.createAnnouncement)
  .get(announcementController.getAnnouncements);

module.exports = router;
