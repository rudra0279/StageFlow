// src/controllers/chatController.js
const Event = require('../models/Event');
const ChatMessage = require('../models/ChatMessage');
const socketEmitter = require('../socket/socketEmitter');

/**
 * Checks whether a user is authorized to participate in the event organizer chat.
 */
async function verifyCommitteeAuthorization(eventId, user) {
  if (!user) return false;
  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'admin') return true;

  const event = await Event.findById(eventId);
  if (!event) return false;

  const userIdStr = (user._id || user.id).toString();
  const eventOwnerId = event.organizerId ? (event.organizerId._id || event.organizerId).toString() : null;
  if (eventOwnerId === userIdStr) return true;

  const committee = event.committee || [];
  return committee.some(m => {
    const mId = m.userId ? (m.userId._id || m.userId).toString() : null;
    return mId === userIdStr && m.isActive !== false;
  });
}

/**
 * Fetch chat history for an event's organizer team.
 */
async function getChatHistory(req, res, next) {
  try {
    const { eventId } = req.params;
    const isAuthorized = await verifyCommitteeAuthorization(eventId, req.user);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to access this event organizer chat',
      });
    }

    const limit = parseInt(req.query.limit, 10) || 50;
    const before = req.query.before;
    const query = { eventId, isDeleted: false };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ timestamp: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send an internal organizer team message.
 */
async function sendMessage(req, res, next) {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const isAuthorized = await verifyCommitteeAuthorization(eventId, req.user);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to post in this event organizer chat',
      });
    }

    const chatMsg = await ChatMessage.create({
      eventId,
      senderId: req.user._id || req.user.id,
      senderName: req.user.name || 'Organizer',
      senderRole: (req.user.role || 'organizer').toUpperCase(),
      senderWorkRole: req.user.workRole || 'OPERATIONS',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });

    socketEmitter.emitOrganizerChatMessage(eventId, chatMsg);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMsg,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getChatHistory,
  sendMessage,
  verifyCommitteeAuthorization,
};
