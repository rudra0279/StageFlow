import { Event } from '../models/Event.js';
import { getFullEventDetails, updateEventStatus } from '../services/eventService.js';
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
    const { event, sessions } = await getFullEventDetails(req.params.id);
    const announcements = await Announcement.find({
      eventId: req.params.id,
      isDismissed: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        event,
        sessions,
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
