// src/controllers/eventController.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
const { getEventState, getRunOfShowData } = require('../services/sessionService');
const { logger } = require('../utils/logger');
const socketEmitter = require('../socket/socketEmitter');

async function createEvent(req, res, next) {
  try {
    const { name, description, venue, audience, date, startTime, endTime } = req.body;
    if (!name || !venue || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Name, venue, date, startTime, and endTime are required',
      });
    }

    const { getDefaultWorkTypes } = require('../constants/workTypes');
    const { ORGANIZER_WORK_ROLES } = require('../constants/organizerRoles');

    const configuredWorkTypes = req.body.workTypes || getDefaultWorkTypes();
    const creatorId = req.user ? (req.user._id || req.user.id) : null;
    const initialCommittee = creatorId ? [
      {
        userId: creatorId,
        name: req.user ? req.user.name : 'Event Organizer',
        email: req.user ? req.user.email : 'organizer@event.io',
        role: 'organizer',
        workRole: ORGANIZER_WORK_ROLES.EVENT_LEAD,
        assignedResponsibilities: ['Overall Event Direction', 'Schedule Authority'],
        joinedAt: new Date().toISOString(),
        isActive: true,
      },
    ] : [];

    const event = await Event.create({
      name,
      description,
      venue,
      audience: audience || 'College students, developers, and guests',
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      organizerId: req.user._id,
      status: 'UPCOMING',
      eventHealth: 'ON_TRACK',
      delayTotalMinutes: 0,
      workTypes: configuredWorkTypes,
      committee: initialCommittee,
    });

    logger.event(`Event created: "${event.name}" (id: ${event._id})`);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

async function getEvents(req, res, next) {
  try {
    const events = await Event.find().populate('organizerId', 'name email').sort({ date: 1 });
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email')
      .populate('currentSessionId');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    logger.event(`Event updated: "${event.name}"`);

    // Broadcast state changed if status or health changed
    socketEmitter.emitEventStateChanged(event._id, {
      state: event.status,
      eventHealth: event.eventHealth,
      delayTotalMinutes: event.delayTotalMinutes,
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    logger.event(`Event deleted: id=${req.params.id}`);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function getLiveState(req, res, next) {
  try {
    const state = await getEventState(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        event: state.event,
        currentSession: state.currentSession,
        nextSession: state.nextSession,
        eventHealth: state.eventHealth,
        delayTotalMinutes: state.event.delayTotalMinutes,
        agendaCount: state.agendaList.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getRunOfShow(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if client explicitly requests JSON output format
    const isJson = req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('application/pdf'));

    if (isJson) {
      const runOfShow = await getRunOfShowData(id);
      if (!runOfShow) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      logger.event(`Run-of-Show JSON exported for event: "${runOfShow.event.title}" (id: ${id})`);

      return res.status(200).json({
        success: true,
        message: 'Run-of-show export retrieved successfully',
        data: runOfShow,
      });
    }

    // PDF Export Generation
    const { generatePdfBuffer } = require('../utils/pdfGenerator');
    const state = await getEventState(id);

    const tracksMap = {};
    (state.agendaList || []).forEach((session) => {
      const trackName = session.track || 'Track A';
      if (!tracksMap[trackName]) {
        tracksMap[trackName] = {
          name: trackName,
          delay: session.trackDelayMinutes || 0,
          sessions: []
        };
      }
      tracksMap[trackName].sessions.push({
        title: session.title,
        speaker: session.speakerName || (session.speakerId && session.speakerId.name) || 'TBA',
        time: session.startTime,
        duration: session.durationMinutes,
        status: session.status,
        delayMinutes: session.delayMinutes
      });
    });

    ['Track A', 'Track B', 'Track C'].forEach((tName) => {
      if (!tracksMap[tName]) {
        tracksMap[tName] = { name: tName, delay: 0, sessions: [] };
      }
    });

    const pdfBuffer = generatePdfBuffer({
      title: event.name || event.title || 'StagePilot Event',
      date: event.date,
      venue: event.venue,
      theme: event.theme,
      totalDelayMinutes: event.delayTotalMinutes || 0,
      tracks: Object.values(tracksMap)
    });

    const filename = `Run-Of-Show-${(event.name || event.title || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

async function getAvailableWorkTypes(req, res) {
  const { AVAILABLE_WORK_TYPES } = require('../constants/workTypes');
  res.status(200).json({
    success: true,
    data: AVAILABLE_WORK_TYPES,
  });
}

async function getEventWorkTypes(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    const { getDefaultWorkTypes } = require('../constants/workTypes');
    const workTypes = (event.workTypes && event.workTypes.length > 0) ? event.workTypes : getDefaultWorkTypes();
    res.status(200).json({
      success: true,
      data: workTypes,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEventWorkTypes(req, res, next) {
  try {
    const { id } = req.params;
    const { workTypes } = req.body;
    if (!Array.isArray(workTypes)) {
      return res.status(400).json({ success: false, message: 'workTypes array is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.workTypes = workTypes;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event work types updated successfully',
      data: event.workTypes,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getLiveState,
  getRunOfShow,
  getAvailableWorkTypes,
  getEventWorkTypes,
  updateEventWorkTypes,
};
