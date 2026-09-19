import { Speaker } from '../models/Speaker.js';

export const getSpeakers = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const filter = eventId ? { eventId } : {};
    const speakers = await Speaker.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: speakers.length, data: speakers });
  } catch (error) {
    next(error);
  }
};

export const createSpeaker = async (req, res, next) => {
  try {
    const speaker = await Speaker.create(req.body);
    res.status(201).json({ success: true, data: speaker });
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
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }
    res.status(200).json({ success: true, data: speaker });
  } catch (error) {
    next(error);
  }
};

export const deleteSpeaker = async (req, res, next) => {
  try {
    const speaker = await Speaker.findByIdAndDelete(req.params.id);
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }
    res.status(200).json({ success: true, message: 'Speaker deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSpeakerByIdOrEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const byEvent = await Speaker.find({ eventId: id }).sort({ name: 1 });
    if (byEvent && byEvent.length > 0) {
      return res.status(200).json({ success: true, count: byEvent.length, data: byEvent });
    }
    const single = await Speaker.findById(id);
    if (single) {
      return res.status(200).json({ success: true, data: single });
    }
    return res.status(200).json({ success: true, count: 0, data: [] });
  } catch (error) {
    next(error);
  }
};
