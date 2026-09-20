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
    const invite = await InviteCode.findOne({ code: cleanCode });
    if (invite) {
      finalRole = invite.role || finalRole;
      finalRoleTitle = invite.roleTitle || finalRoleTitle;
      finalResponsibility = invite.responsibility || finalResponsibility;
      await InviteCode.findByIdAndUpdate(invite._id, { $inc: { usageCount: 1 } });
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
