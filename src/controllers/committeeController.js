// src/controllers/committeeController.js
const Event = require('../models/Event');
const User = require('../models/User');
const { ORGANIZER_WORK_ROLES } = require('../constants/organizerRoles');

/**
 * Ensures the event organizer is recorded as the default EVENT_LEAD.
 */
function ensureOrganizerInCommittee(event) {
  if (!event.committee) event.committee = [];

  const orgId = event.organizerId ? (event.organizerId._id || event.organizerId).toString() : null;
  if (!orgId) return event.committee;

  const exists = event.committee.some(m => {
    const mId = m.userId ? (m.userId._id || m.userId).toString() : (m._id || m.id ? (m._id || m.id).toString() : null);
    return mId === orgId;
  });

  if (!exists) {
    const orgName = event.organizerId && typeof event.organizerId === 'object' ? event.organizerId.name : 'Event Organizer';
    const orgEmail = event.organizerId && typeof event.organizerId === 'object' ? event.organizerId.email : 'organizer@event.io';

    event.committee.unshift({
      userId: orgId,
      name: orgName,
      email: orgEmail,
      role: 'organizer',
      workRole: ORGANIZER_WORK_ROLES.EVENT_LEAD,
      assignedResponsibilities: ['Overall Event Management', 'Executive Direction'],
      joinedAt: event.createdAt || new Date().toISOString(),
      isActive: true,
    });
  }

  return event.committee;
}

/**
 * Get committee members for an event.
 */
async function getCommittee(req, res, next) {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate('organizerId', 'name email role workRole phone avatar');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const committee = ensureOrganizerInCommittee(event);
    await event.save();

    // Sanitize committee data: exclude passwords, secrets, private tokens
    const sanitized = committee.map((m, idx) => ({
      id: m._id ? m._id.toString() : (m.id || `cm_${idx}`),
      userId: m.userId ? (m.userId._id ? m.userId._id.toString() : m.userId.toString()) : null,
      name: m.name || (m.userId && m.userId.name ? m.userId.name : 'Committee Member'),
      email: m.email || (m.userId && m.userId.email ? m.userId.email : ''),
      role: m.role || 'organizer',
      workRole: m.workRole || ORGANIZER_WORK_ROLES.OPERATIONS,
      assignedResponsibilities: Array.isArray(m.assignedResponsibilities) ? m.assignedResponsibilities : [],
      joinedAt: m.joinedAt || new Date().toISOString(),
      isActive: m.isActive !== undefined ? m.isActive : true,
      avatar: m.avatar || (m.userId && m.userId.avatar ? m.userId.avatar : ''),
      phone: m.phone || (m.userId && m.userId.phone ? m.userId.phone : ''),
    }));

    res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add a member to the event committee.
 */
async function addCommitteeMember(req, res, next) {
  try {
    const { eventId } = req.params;
    const { userId, email, name, workRole, assignedResponsibilities } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!event.committee) event.committee = [];

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    const memberName = targetUser ? targetUser.name : (name || 'Committee Member');
    const memberEmail = targetUser ? targetUser.email : (email || '');
    const memberUserId = targetUser ? targetUser._id : (userId || null);

    // Check if already in committee
    const alreadyExists = event.committee.some(m => {
      const existingUserId = m.userId ? (m.userId._id || m.userId).toString() : null;
      return existingUserId && memberUserId && existingUserId === memberUserId.toString();
    });

    if (alreadyExists) {
      return res.status(400).json({ success: false, message: 'User is already a member of this committee' });
    }

    const crypto = require('crypto');
    const memberId = crypto.randomBytes(12).toString('hex');

    const newMember = {
      _id: memberId,
      id: memberId,
      userId: memberUserId,
      name: memberName,
      email: memberEmail,
      role: targetUser ? targetUser.role : 'organizer',
      workRole: workRole || ORGANIZER_WORK_ROLES.OPERATIONS,
      assignedResponsibilities: Array.isArray(assignedResponsibilities) ? assignedResponsibilities : [],
      joinedAt: new Date().toISOString(),
      isActive: true,
    };

    event.committee.push(newMember);
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Committee member added successfully',
      data: newMember,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a committee member's work role or responsibilities.
 */
async function updateCommitteeMember(req, res, next) {
  try {
    const { eventId, memberId } = req.params;
    const { workRole, assignedResponsibilities, isActive } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!event.committee) event.committee = [];

    const member = event.committee.find(m => {
      const idStr = m._id ? m._id.toString() : (m.id ? m.id.toString() : '');
      const userIdStr = m.userId ? (m.userId._id || m.userId).toString() : '';
      return idStr === memberId || userIdStr === memberId;
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }

    if (workRole !== undefined) member.workRole = workRole;
    if (assignedResponsibilities !== undefined) member.assignedResponsibilities = assignedResponsibilities;
    if (isActive !== undefined) member.isActive = Boolean(isActive);

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Committee member updated successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a committee member.
 */
async function removeCommitteeMember(req, res, next) {
  try {
    const { eventId, memberId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!event.committee) event.committee = [];

    const initialLen = event.committee.length;
    event.committee = event.committee.filter(m => {
      const idStr = m._id ? m._id.toString() : (m.id ? m.id.toString() : '');
      const userIdStr = m.userId ? (m.userId._id || m.userId).toString() : '';
      return idStr !== memberId && userIdStr !== memberId;
    });

    if (event.committee.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Committee member removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCommittee,
  addCommitteeMember,
  updateCommitteeMember,
  removeCommitteeMember,
};
