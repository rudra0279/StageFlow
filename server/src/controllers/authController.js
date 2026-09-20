import { registerUser, loginUser } from '../services/authService.js';
import { InviteCode } from '../models/InviteCode.js';

export const verifyInviteCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation code.' });
    }

    const cleanCode = code.trim().toUpperCase();
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
};

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
};
