import express from 'express';
import { verifyInviteCode, register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { getAuditLogs } from '../utils/auditLogger.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.post('/verify-code', authLimiter, verifyInviteCode);
router.post('/verifyCode', authLimiter, verifyInviteCode);
router.post('/validate-invite', authLimiter, verifyInviteCode);
router.post('/validateInvite', authLimiter, verifyInviteCode);
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);

// Security activity logs (Organizers only)
router.get('/audit-logs', protect, authorize(ROLES.ORGANIZER), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const logs = getAuditLogs(limit);
  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

export default router;
