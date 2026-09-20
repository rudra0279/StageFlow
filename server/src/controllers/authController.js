import { registerUser, loginUser } from '../services/authService.js';
import { InviteCode } from '../models/InviteCode.js';

const DEFAULT_INVITE_CODES = [
  {
    code: 'ORG123',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Event Lead',
    responsibility: 'Operations + Coordination',
    status: 'ACTIVE',
    maxUses: 1000,
  },
  {
    code: 'ANC123',
    registrationType: 'ANCHOR',
    role: 'anchor',
    roleTitle: 'Stage Anchor / MC',
    responsibility: 'Stage MC & Teleprompter Execution',
    status: 'ACTIVE',
    maxUses: 1000,
  },
  {
    code: 'ORG-7F29X',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Event Lead',
    responsibility: 'Operations + Coordination',
    status: 'ACTIVE',
    maxUses: 100,
  },
  {
    code: 'TECH-4B82Y',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Technical Lead',
    responsibility: 'AV + Stage Technology',
    status: 'ACTIVE',
    maxUses: 100,
  },
  {
    code: 'STAGE-91C2M',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Stage Manager',
    responsibility: 'Presentation systems & Timing',
    status: 'ACTIVE',
    maxUses: 100,
  },
  {
    code: 'LOG-33A8K',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Logistics Lead',
    responsibility: 'Venue Operations & Hospitality',
    status: 'ACTIVE',
    maxUses: 100,
  },
  {
    code: 'ANC-55D1P',
    registrationType: 'ANCHOR',
    role: 'anchor',
    roleTitle: 'Stage Anchor / MC',
    responsibility: 'Stage MC & Teleprompter Execution',
    status: 'ACTIVE',
    maxUses: 100,
  },
  {
    code: 'EXPIRED-99',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Event Lead',
    responsibility: 'Operations',
    status: 'EXPIRED',
    maxUses: 100,
  },
  {
    code: 'DISABLED-88',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Technical Lead',
    responsibility: 'AV Setup',
    status: 'DISABLED',
    maxUses: 100,
  },
  {
    code: 'EXHAUSTED-77',
    registrationType: 'ORGANIZER',
    role: 'organizer',
    roleTitle: 'Volunteer',
    responsibility: 'Audience Control',
    status: 'EXHAUSTED',
    usageCount: 10,
    maxUses: 10,
  },
];

export const verifyInviteCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    let invite = await InviteCode.findOne({ code: cleanCode });

    if (!invite) {
      const def = DEFAULT_INVITE_CODES.find((c) => c.code === cleanCode);
      if (def) {
        try {
          invite = await InviteCode.create(def);
        } catch (e) {
          invite = def;
        }
      }
    }

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
