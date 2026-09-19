import { Speaker } from '../models/Speaker.js';

export const getSpeakers = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const filter = eventId ? { eventId } : {};
    const speakers = await Speaker.find(filter).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: speakers.length,
      data: speakers
    });
  } catch (error) {
    next(error);
  }
};

export const createSpeaker = async (req, res, next) => {
  try {
    const speaker = await Speaker.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Speaker created successfully',
      data: speaker
    });
  } catch (error) {
    next(error);
  }
};

export const updateSpeaker = async (req, res, next) => {
  try {
    const speaker = await Speaker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Speaker updated successfully',
      data: speaker
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSpeaker = async (req, res, next) => {
  try {
    const speaker = await Speaker.findByIdAndDelete(req.params.id);
    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Speaker deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
