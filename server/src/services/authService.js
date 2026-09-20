import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { InviteCode } from '../models/InviteCode.js';
import { ENV } from '../config/env.js';

export const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: String(userId),
      role: (role || '').toUpperCase()
    },
    ENV.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: ENV.JWT_EXPIRES_IN
    }
  );
};

export const registerUser = async (userData) => {
  const normalizedEmail = (userData.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  let finalRole = userData.role || 'organizer';
  let finalRoleTitle = userData.roleTitle || (finalRole === 'anchor' ? 'Stage Anchor / MC' : 'Organizer');
  let finalResponsibility = userData.responsibility || (finalRole === 'anchor' ? 'Stage MC & Teleprompter Execution' : 'Event Operations & Coordination');

  const rawInviteCode = userData.inviteCode || userData.code;

  if (rawInviteCode) {
    const cleanCode = String(rawInviteCode).trim().toUpperCase();
    let invite = await InviteCode.findOne({ code: cleanCode });

    if (!invite) {
      const DEFAULT_CODES = {
        'ORG123': { role: 'organizer', roleTitle: 'Event Lead', responsibility: 'Operations + Coordination' },
        'ANC123': { role: 'anchor', roleTitle: 'Stage Anchor / MC', responsibility: 'Stage MC & Teleprompter Execution' },
        'ORG-7F29X': { role: 'organizer', roleTitle: 'Event Lead', responsibility: 'Operations + Coordination' },
        'TECH-4B82Y': { role: 'organizer', roleTitle: 'Technical Lead', responsibility: 'AV + Stage Technology' },
        'STAGE-91C2M': { role: 'organizer', roleTitle: 'Stage Manager', responsibility: 'Presentation systems & Timing' },
        'LOG-33A8K': { role: 'organizer', roleTitle: 'Logistics Lead', responsibility: 'Venue Operations & Hospitality' },
        'ANC-55D1P': { role: 'anchor', roleTitle: 'Stage Anchor / MC', responsibility: 'Stage MC & Teleprompter Execution' },
      };
      if (DEFAULT_CODES[cleanCode]) {
        try {
          invite = await InviteCode.create({ code: cleanCode, ...DEFAULT_CODES[cleanCode] });
        } catch (e) {
          invite = DEFAULT_CODES[cleanCode];
        }
      }
    }

    if (!invite) {
      const error = new Error('Invalid or expired invitation code.');
      error.statusCode = 400;
      throw error;
    }

    // Check expiration
    if (invite.status === 'EXPIRED' || (invite.expiresAt && new Date(invite.expiresAt) < new Date())) {
      const error = new Error('Invalid or expired invitation code.');
      error.statusCode = 400;
      throw error;
    }

    // Check disabled
    if (invite.status === 'DISABLED' || invite.isActive === false) {
      const error = new Error('This invitation code has been disabled.');
      error.statusCode = 400;
      throw error;
    }

    // Check exhaustion
    const count = invite.usageCount !== undefined ? invite.usageCount : (invite.currentUses || 0);
    if (invite.status === 'EXHAUSTED' || (invite.maxUses && count >= invite.maxUses)) {
      const error = new Error('This invitation code has exceeded its usage limit.');
      error.statusCode = 400;
      throw error;
    }

    // Authoritative role assignment strictly from validated invite
    finalRole = invite.role || finalRole;
    finalRoleTitle = invite.workRole || invite.roleTitle || finalRoleTitle;
    finalResponsibility = invite.responsibility || finalResponsibility;

    if (invite._id) {
      await InviteCode.findByIdAndUpdate(invite._id, {
        $inc: { usageCount: 1, currentUses: 1 }
      });
    }
  }

  const user = await User.create({
    ...userData,
    email: normalizedEmail,
    role: finalRole,
    roleTitle: finalRoleTitle,
    responsibility: finalResponsibility,
    contactPhone: userData.contactPhone || '',
    status: 'ACTIVE'
  });

  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle,
      responsibility: user.responsibility,
      contactPhone: user.contactPhone,
      avatarUrl: user.avatarUrl
    },
    token
  };
};

export const loginUser = async (email, password) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle || (user.role === 'anchor' ? 'Stage Anchor / MC' : 'Event Lead'),
      responsibility: user.responsibility || (user.role === 'anchor' ? 'Stage MC & Teleprompter Execution' : 'Operations + Coordination'),
      contactPhone: user.contactPhone || '+1 (555) 234-5678',
      avatarUrl: user.avatarUrl
    },
    token
  };
};
