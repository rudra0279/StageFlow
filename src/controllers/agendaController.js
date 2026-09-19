// src/controllers/agendaController.js
const Agenda = require('../models/Agenda');
const socketEmitter = require('../socket/socketEmitter');
const { logger } = require('../utils/logger');

async function createAgendaItem(req, res, next) {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      speakerId,
      startTime,
      endTime,
      durationMinutes,
      type,
      room,
      orderIndex,
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Title, startTime, and endTime are required',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = durationMinutes || Math.round((end - start) / (60 * 1000)) || 30;

    const count = await Agenda.countDocuments({ eventId });

    const agendaItem = await Agenda.create({
      eventId,
      title,
      description: description || '',
      speakerId: speakerId || null,
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      type: type || 'KEYNOTE',
      room: room || 'Main Stage',
      status: 'UPCOMING',
      orderIndex: orderIndex !== undefined ? orderIndex : count,
    });

    const populated = await Agenda.findById(agendaItem._id).populate('speakerId');
    logger.event(`Agenda session created: "${populated.title}" for event: ${eventId}`);

    // Broadcast agendaUpdated
    const allAgenda = await Agenda.find({ eventId }).populate('speakerId').sort({ orderIndex: 1 });
    socketEmitter.emitAgendaUpdated(eventId, allAgenda);

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function getAgenda(req, res, next) {
  try {
    const { eventId } = req.params;
    const agenda = await Agenda.find({ eventId })
      .populate('speakerId')
      .sort({ orderIndex: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: agenda.length,
      data: agenda,
    });
  } catch (error) {
    next(error);
  }
}

async function updateAgendaItem(req, res, next) {
  try {
    const { eventId, id } = req.params;
    const updated = await Agenda.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('speakerId');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Agenda item not found' });
    }

    const allAgenda = await Agenda.find({ eventId }).populate('speakerId').sort({ orderIndex: 1 });
    socketEmitter.emitAgendaUpdated(eventId, allAgenda);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAgendaItem(req, res, next) {
  try {
    const { eventId, id } = req.params;
    const item = await Agenda.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Agenda item not found' });
    }

    const allAgenda = await Agenda.find({ eventId }).populate('speakerId').sort({ orderIndex: 1 });
    socketEmitter.emitAgendaUpdated(eventId, allAgenda);

    res.status(200).json({ success: true, message: 'Agenda item deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAgendaItem,
  getAgenda,
  updateAgendaItem,
  deleteAgendaItem,
};
