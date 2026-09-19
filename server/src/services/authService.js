import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
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

  const user = await User.create(userData);
  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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
      avatarUrl: user.avatarUrl
    },
    token
  };
};
