import express from 'express';
import { generateScript, copilotQuery, teleprompterAssist } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to route specific script types to generateScript
const routeToScript = (scriptType) => (req, res, next) => {
  req.body.scriptType = req.body.scriptType || req.body.type || scriptType;
  return generateScript(req, res, next);
};

// AI Service Integration Placeholder & Discovery
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

// Primary script generation endpoints
router.post('/generate-script', protect, generateScript);
router.post('/generate', protect, generateScript);

// Copilot and AI assistant query endpoints
router.post('/copilot-query', protect, copilotQuery);
router.post('/query', protect, copilotQuery);
router.post('/assistant', protect, copilotQuery);

// Intelligent Teleprompter assistance
router.post('/teleprompter-assist', protect, teleprompterAssist);

// Granular script generation endpoints
router.post('/opening', protect, routeToScript('opening'));
router.post('/introduction', protect, routeToScript('introduction'));
router.post('/transition', protect, routeToScript('transition'));
router.post('/closing', protect, routeToScript('closing'));
router.post('/filler', protect, routeToScript('filler'));
router.post('/emergency', protect, routeToScript('emergency'));
router.post('/delay', protect, routeToScript('delay'));
router.post('/announcement', protect, routeToScript('emergency'));

export default router;

