// src/services/inviteService.js
const crypto = require('crypto');
const InviteCode = require('../models/InviteCode');

function generateRandomCode(prefix = 'ORG') {
  const bytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${bytes}`;
}

/**
 * Validates an invitation code and returns its authorization configuration.
 *
 * @param {string} code
 * @returns {Promise<{ valid: boolean, invite?: Object, message?: string, code?: string }>}
 */
async function validateInviteCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Invite code is required' };
  }

  const normalizedCode = code.trim().toUpperCase();
  const invite = await InviteCode.findOne({ code: normalizedCode });

  if (!invite) {
    return { valid: false, message: 'Invalid invite code' };
  }

  if (!invite.isActive) {
    return { valid: false, message: 'Invite code is disabled' };
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { valid: false, message: 'Invite code has expired' };
  }

  if (typeof invite.maxUses === 'number' && invite.currentUses >= invite.maxUses) {
    return { valid: false, message: 'Invite code has reached its maximum uses' };
  }

  return {
    valid: true,
    invite: {
      id: invite._id ? invite._id.toString() : invite.id,
      code: invite.code,
      registrationType: invite.registrationType,
      role: invite.role,
      workRole: invite.workRole || 'OPERATIONS',
      eventId: invite.eventId ? invite.eventId.toString() : null,
      maxUses: invite.maxUses,
      currentUses: invite.currentUses,
      expiresAt: invite.expiresAt,
    },
  };
}

/**
 * Atomically consumes an invite code upon successful registration.
 *
 * @param {string} code
 * @returns {Promise<Object>} Updated invite code document
 */
async function consumeInviteCode(code) {
  const normalizedCode = code.trim().toUpperCase();
  const invite = await InviteCode.findOne({ code: normalizedCode });
  if (!invite) {
    throw new Error('Invite code not found');
  }

  invite.currentUses = (invite.currentUses || 0) + 1;
  await invite.save();
  return invite;
}

/**
 * Creates a new invitation code.
 *
 * @param {Object} data
 * @param {Object} [creator]
 * @returns {Promise<Object>} Created invite document
 */
async function createInviteCode(data, creator = null) {
  const registrationType = (data.registrationType || (data.role ? data.role.toUpperCase() : 'ORGANIZER')).toUpperCase();
  const role = (data.role || registrationType.toLowerCase()).toLowerCase();
  const prefix = registrationType === 'ANCHOR' ? 'ANCH' : (registrationType === 'ADMIN' ? 'ADM' : 'ORG');
  const code = (data.code || generateRandomCode(prefix)).trim().toUpperCase();

  const existing = await InviteCode.findOne({ code });
  if (existing) {
    throw new Error(`Invite code "${code}" already exists`);
  }

  const invite = await InviteCode.create({
    code,
    registrationType,
    role,
    workRole: data.workRole || 'OPERATIONS',
    eventId: data.eventId || null,
    createdBy: creator ? (creator._id || creator.id) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    maxUses: typeof data.maxUses === 'number' ? data.maxUses : 1,
    currentUses: 0,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
  });

  return invite;
}

module.exports = {
  validateInviteCode,
  consumeInviteCode,
  createInviteCode,
  generateRandomCode,
};
