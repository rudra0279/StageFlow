import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { InviteCode } from '../models/InviteCode.js';
import { ENV } from '../config/env.js';

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });
};

export const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  let finalRole = userData.role || 'organizer';
  let finalRoleTitle = userData.roleTitle || (finalRole === 'anchor' ? 'Stage Anchor / MC' : 'Organizer');
  let finalResponsibility = userData.responsibility || (finalRole === 'anchor' ? 'Stage MC & Teleprompter Execution' : 'Event Operations & Coordination');

  if (userData.inviteCode) {
    const cleanCode = userData.inviteCode.trim().toUpperCase();
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
    if (invite) {
      finalRole = invite.role || finalRole;
      finalRoleTitle = invite.roleTitle || finalRoleTitle;
      finalResponsibility = invite.responsibility || finalResponsibility;
      if (invite._id) {
        await InviteCode.findByIdAndUpdate(invite._id, { $inc: { usageCount: 1 } });
      }
    }
  }

  const user = await User.create({
    ...userData,
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
  const user = await User.findOne({ email }).select('+password');
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
