import { Session } from '../models/Session.js';

export const getAgenda = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const filter = eventId ? { eventId } : {};
    const sessions = await Session.find(filter)
      .sort({ orderIndex: 1, scheduledStartTime: 1 })
      .populate('speakerId');

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

export const createAgendaItem = async (req, res, next) => {
  try {
    const session = await Session.create({
      ...req.body,
      calculatedStartTime: req.body.calculatedStartTime || req.body.scheduledStartTime
    });

    const populated = await Session.findById(session._id).populate('speakerId');
    res.status(201).json({
      success: true,
      message: 'Agenda item created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateAgendaItem = async (req, res, next) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('speakerId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Agenda item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agenda item updated successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAgendaItem = async (req, res, next) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Agenda item not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Agenda item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAgendaByEventOrId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const byEvent = await Session.find({ eventId: id })
      .sort({ orderIndex: 1, scheduledStartTime: 1 })
      .populate('speakerId');

    if (byEvent && byEvent.length > 0) {
      return res.status(200).json({ success: true, count: byEvent.length, data: byEvent });
    }

    const single = await Session.findById(id).populate('speakerId');
    if (single) {
      return res.status(200).json({ success: true, data: single });
    }

    return res.status(200).json({ success: true, count: 0, data: [] });
  } catch (error) {
    next(error);
  }
};
