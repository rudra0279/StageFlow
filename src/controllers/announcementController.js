// src/controllers/announcementController.js
const Announcement = require('../models/Announcement');
const socketEmitter = require('../socket/socketEmitter');
const { buildEventContext } = require('../services/ai/contextBuilder');
const { generateScript } = require('../services/ai/aiService');
const { logger } = require('../utils/logger');

async function createAnnouncement(req, res, next) {
  try {
    const { eventId } = req.params;
    const { message, type, priority, autoGenerateSpeech } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let formattedSpeech = req.body.formattedSpeech || '';

    // If anchor-ready speech wasn't provided or autoGenerateSpeech is requested
    if (!formattedSpeech && autoGenerateSpeech !== false) {
      try {
        const context = await buildEventContext(eventId, {
          rawMessage: message,
          announcementType: type || 'GENERAL',
          maxLength: 70,
        });
        const aiResult = await generateScript('announcement', context);
        if (aiResult.success) {
          formattedSpeech = aiResult.script;
        }
      } catch (aiErr) {
        logger.error('[AI]', 'Could not generate AI announcement speech, using raw message', aiErr);
        formattedSpeech = message;
      }
    }

    const announcement = await Announcement.create({
      eventId,
      message,
      formattedSpeech: formattedSpeech || message,
      type: type || 'GENERAL',
      priority: priority || 'NORMAL',
      createdBy: req.user._id,
    });

    logger.announcement(`Created announcement for event: ${eventId}: "${announcement.message}"`);

    // Broadcast in real-time to event room
    socketEmitter.emitAnnouncementCreated(eventId, announcement);

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

async function getAnnouncements(req, res, next) {
  try {
    const { eventId } = req.params;
    const announcements = await Announcement.find({ eventId })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
};
