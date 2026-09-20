// src/controllers/speakerController.js
const Speaker = require('../models/Speaker');
const { logger } = require('../utils/logger');

async function createSpeaker(req, res, next) {
  try {
    const { eventId } = req.params;
    const { name, designation, organization, topic, bio, photo, linkedin } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Speaker name is required' });
    }

    const speaker = await Speaker.create({
      eventId,
      name,
      designation: designation || '',
      organization: organization || '',
      topic: topic || '',
      bio: bio || '',
      photo: photo || '',
      linkedin: linkedin || '',
    });

    logger.event(`Speaker added: "${speaker.name}" to event: ${eventId}`);

    res.status(201).json({
      success: true,
      data: speaker,
    });
  } catch (error) {
    next(error);
  }
}

async function getSpeakers(req, res, next) {
  try {
    const { eventId } = req.params;
    const speakers = await Speaker.find({ eventId }).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: speakers.length,
      data: speakers,
    });
  } catch (error) {
    next(error);
  }
}

async function getSpeakerById(req, res, next) {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }
    res.status(200).json({ success: true, data: speaker });
  } catch (error) {
    next(error);
  }
}

async function updateSpeaker(req, res, next) {
  try {
    const speaker = await Speaker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }
    res.status(200).json({ success: true, data: speaker });
  } catch (error) {
    next(error);
  }
}

async function deleteSpeaker(req, res, next) {
  try {
    const speaker = await Speaker.findByIdAndDelete(req.params.id);
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }
    res.status(200).json({ success: true, message: 'Speaker deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSpeaker,
  getSpeakers,
  getSpeakerById,
  updateSpeaker,
  deleteSpeaker,
};
