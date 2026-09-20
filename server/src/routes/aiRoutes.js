import express from 'express';
import {
  generateScript,
  copilotQuery,
  teleprompterAssist,
  handleQuestionAssist
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

/**
 * AI Security Authentication:
 * Enforces token verification when credentials are provided.
 * Enforces authentication in production to prevent external API quota abuse.
 */
const aiAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => {
      return authorize(ROLES.ORGANIZER, ROLES.ANCHOR, 'organizer', 'anchor')(req, res, next);
    });
  }
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access AI endpoints. Token is missing.'
    });
  }
  next();
};

/**
 * Validate input size for AI prompts and queries to prevent prompt bloat / resource exhaustion
 */
const validateAiInput = (req, res, next) => {
  const inputStr = req.body?.prompt || req.body?.query || req.body?.message || '';
  if (typeof inputStr === 'string' && inputStr.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'AI prompt is too large. Maximum allowed size is 2000 characters.'
    });
  }
  next();
};

// Helper to route specific script types to generateScript
const routeToScript = (scriptType) => (req, res, next) => {
  req.body.scriptType = req.body.scriptType || req.body.type || scriptType;
  return generateScript(req, res, next);
};

// AI Service Integration Discovery
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'StagePilot AI Integration Subsystem',
    status: 'ready',
    endpoints: [
      'POST /api/ai/generate',
      'POST /api/ai/generate-script',
      'POST /api/ai/query',
      'POST /api/ai/copilot-query',
      'POST /api/ai/assistant',
      'POST /api/ai/question-assist',
      'POST /api/ai/teleprompter-assist',
      'POST /api/ai/introduction',
      'POST /api/ai/opening',
      'POST /api/ai/transition',
      'POST /api/ai/closing',
      'POST /api/ai/filler',
      'POST /api/ai/emergency',
      'POST /api/ai/delay'
    ]
  });
});

// Stage 4: AI Question Assist
router.post('/question-assist', aiAuth, aiLimiter, validateAiInput, handleQuestionAssist);

// Primary script generation endpoints
router.post('/generate-script', aiAuth, aiLimiter, validateAiInput, generateScript);
router.post('/generate', aiAuth, aiLimiter, validateAiInput, generateScript);

// Copilot and AI assistant query endpoints
router.post('/copilot-query', aiAuth, aiLimiter, validateAiInput, copilotQuery);
router.post('/query', aiAuth, aiLimiter, validateAiInput, copilotQuery);
router.post('/assistant', aiAuth, aiLimiter, validateAiInput, copilotQuery);

// Intelligent Teleprompter assistance
router.post('/teleprompter-assist', aiAuth, aiLimiter, validateAiInput, teleprompterAssist);

// Granular script generation endpoints
router.post('/opening', aiAuth, aiLimiter, validateAiInput, routeToScript('opening'));
router.post('/introduction', aiAuth, aiLimiter, validateAiInput, routeToScript('introduction'));
router.post('/transition', aiAuth, aiLimiter, validateAiInput, routeToScript('transition'));
router.post('/closing', aiAuth, aiLimiter, validateAiInput, routeToScript('closing'));
router.post('/filler', aiAuth, aiLimiter, validateAiInput, routeToScript('filler'));
router.post('/emergency', aiAuth, aiLimiter, validateAiInput, routeToScript('emergency'));
router.post('/delay', aiAuth, aiLimiter, validateAiInput, routeToScript('delay'));
router.post('/announcement', aiAuth, aiLimiter, validateAiInput, routeToScript('announcement'));

export default router;
