import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { getFullEventDetails, updateEventStatus, getRunOfShowData } from '../services/eventService.js';
import { Announcement } from '../models/Announcement.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({
      ...req.body,
      organizerId: req.user._id
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { event, sessions, speakers } = await getFullEventDetails(req.params.id);
    const announcements = await Announcement.find({
      eventId: req.params.id,
      isDismissed: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        event,
        sessions,
        speakers: speakers || [],
        announcements
      }
    });
  } catch (error) {
    next(error);
  }
};

export const setStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const event = await updateEventStatus(req.params.id, status);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const broadcastAnnouncement = async (req, res, next) => {
  try {
    const { message, urgency, type } = req.body;
    const eventId = req.params.id;

    const announcement = await Announcement.create({
      eventId,
      message,
      urgency: urgency || 'MEDIUM',
      type: type || 'GENERAL',
      senderRole: req.user.role
    });

    socketService.emitToEvent(eventId, SOCKET_EVENTS.STAGE_ALERT, {
      id: announcement._id,
      eventId,
      message,
      urgency: announcement.urgency,
      type: announcement.type,
      timestamp: announcement.createdAt
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getRunOfShow = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isJson = req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('application/pdf'));

    if (isJson) {
      const runOfShow = await getRunOfShowData(id);
      if (!runOfShow) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Run-of-show export retrieved successfully',
        data: runOfShow
      });
    }

    const { sessions } = await getFullEventDetails(id);
    const { generatePdfBuffer } = await import('../utils/pdfGenerator.js');

    const tracksMap = {};
    (sessions || []).forEach((session) => {
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
        duration: session.durationMinutes || session.duration,
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
      title: event.title || event.name || 'StagePilot Event',
      date: event.date,
      venue: event.venue || 'Main Stage',
      theme: event.theme || 'Tech',
      totalDelayMinutes: event.totalDelayMinutes || event.delayTotalMinutes || 0,
      tracks: Object.values(tracksMap)
    });

    const filename = `Run-Of-Show-${(event.title || event.name || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getRunOfShowPdf = getRunOfShow;
