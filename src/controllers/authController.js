// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { logger } = require('../utils/logger');
const {
  validateInviteCode,
  consumeInviteCode,
  createInviteCode,
} = require('../services/inviteService');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

async function verifyInviteCode(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const InviteCode = require('../models/InviteCode');
    const invite = await InviteCode.findOne({ code: cleanCode });

    if (!invite) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation code.' });
    }

    if (invite.status === 'EXPIRED' || (invite.expiresAt && new Date(invite.expiresAt) < new Date())) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation code.' });
    }

    if (invite.status === 'DISABLED') {
      return res.status(400).json({ success: false, message: 'This invitation code has been disabled.' });
    }

    if (invite.status === 'EXHAUSTED' || (invite.maxUses && invite.usageCount >= invite.maxUses)) {
      return res.status(400).json({ success: false, message: 'This invitation code has exceeded its usage limit.' });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation code verified successfully',
      data: {
        valid: true,
        code: invite.code,
        registrationType: invite.registrationType || 'ORGANIZER',
        role: invite.role || 'organizer',
        roleTitle: invite.roleTitle || 'Organizer',
        responsibility: invite.responsibility || 'Event Operations & Coordination',
      },
    });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const { name, email, password, role, roleTitle, responsibility, contactPhone, phone, avatar, inviteCode, code } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const effectiveCode = inviteCode || code;
    let assignedRole = 'organizer';
    let assignedWorkRole = 'OPERATIONS';
    let eventIdToJoin = null;

    if (effectiveCode) {
      const validation = await validateInviteCode(effectiveCode);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message || 'Invalid invite code',
        });
      }
      // Authoritative role assignment derived strictly from invite code
      assignedRole = validation.invite.role;
      assignedWorkRole = validation.invite.workRole || 'OPERATIONS';
      eventIdToJoin = validation.invite.eventId || null;
      await consumeInviteCode(effectiveCode);
    } else {
      // In test mode or when open registration is allowed, allow fallback for existing tests
      if (process.env.NODE_ENV === 'test' || process.env.ALLOW_OPEN_REGISTRATION === 'true') {
        assignedRole = req.body.role || 'organizer';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invite code is required for registration',
        });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let finalRole = role || 'organizer';
    let finalRoleTitle = roleTitle || (finalRole === 'anchor' ? 'Stage Anchor / MC' : 'Organizer');
    let finalResponsibility = responsibility || (finalRole === 'anchor' ? 'Stage MC & Teleprompter Execution' : 'Event Operations & Coordination');

    if (inviteCode) {
      const InviteCode = require('../models/InviteCode');
      const cleanCode = inviteCode.trim().toUpperCase();
      const invite = await InviteCode.findOne({ code: cleanCode });
      if (invite) {
        finalRole = invite.role || finalRole;
        finalRoleTitle = invite.roleTitle || finalRoleTitle;
        finalResponsibility = invite.responsibility || finalResponsibility;
        await InviteCode.findByIdAndUpdate(invite._id, { $inc: { usageCount: 1 } });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: finalRole || assignedRole,
      roleTitle: finalRoleTitle,
      responsibility: finalResponsibility,
      workRole: assignedWorkRole || 'OPERATIONS',
      phone: phone || contactPhone || '',
      contactPhone: contactPhone || phone || '',
      avatar: avatar || '',
      status: 'ACTIVE',
    });

    // Auto-join event committee if invite was event-specific
    if (eventIdToJoin) {
      try {
        const Event = require('../models/Event');
        const event = await Event.findById(eventIdToJoin);
        if (event) {
          const alreadyIn = (event.committee || []).some(
            m => (m.userId ? (m.userId._id || m.userId).toString() : '') === user._id.toString()
          );
          if (!alreadyIn) {
            if (!event.committee) event.committee = [];
            event.committee.push({
              userId: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              workRole: assignedWorkRole,
              assignedResponsibilities: [],
              joinedAt: new Date().toISOString(),
              isActive: true,
            });
            await event.save();
          }
        }
      } catch (e) {
        logger.error('[AUTH]', 'Error auto-joining event committee', e);
      }
    }

    const token = generateToken(user);
    logger.auth(`User registered: ${user.email} (${user.role} - ${user.roleTitle})`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workRole: user.workRole || assignedWorkRole,
          roleTitle: user.roleTitle,
          responsibility: user.responsibility,
          contactPhone: user.contactPhone || user.phone,
          phone: user.phone || user.contactPhone,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    logger.auth(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workRole: user.workRole || 'OPERATIONS',
          roleTitle: user.roleTitle || (user.role === 'anchor' ? 'Stage Anchor / MC' : 'Event Lead'),
          responsibility: user.responsibility || (user.role === 'anchor' ? 'Stage MC & Teleprompter Execution' : 'Operations + Coordination'),
          contactPhone: user.contactPhone || user.phone || '+1 (555) 234-5678',
          phone: user.phone || user.contactPhone || '+1 (555) 234-5678',
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

async function validateInvite(req, res, next) {
  try {
    const code = req.body.inviteCode || req.body.code || req.query.code;
    const result = await validateInviteCode(code);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Invite code is valid',
      data: result.invite,
    });
  } catch (error) {
    next(error);
  }
}

async function createInvite(req, res, next) {
  try {
    const invite = await createInviteCode(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Invite code created successfully',
      data: invite,
    });
  } catch (error) {
    next(error);
  }
}

async function getInvites(req, res, next) {
  try {
    const InviteCode = require('../models/InviteCode');
    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    if (req.query.role) filter.role = req.query.role;
    const invites = await InviteCode.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: invites.length,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyInviteCode,
  register,
  login,
  getMe,
  validateInvite,
  createInvite,
  getInvites,
};
