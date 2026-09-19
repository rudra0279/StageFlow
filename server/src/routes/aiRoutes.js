import express from 'express';
import { generateScript, copilotQuery, teleprompterAssist, handleQuestionAssist, handleQuestionAssist as questionAssist } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

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
router.post('/question-assist', handleQuestionAssist);

// Primary script generation endpoints
router.post('/generate-script', generateScript);
router.post('/generate', generateScript);

// Copilot and AI assistant query endpoints
router.post('/copilot-query', copilotQuery);
router.post('/query', copilotQuery);
router.post('/assistant', copilotQuery);

// Intelligent Teleprompter assistance
router.post('/teleprompter-assist', teleprompterAssist);

// Granular script generation endpoints
router.post('/opening', routeToScript('opening'));
router.post('/introduction', routeToScript('introduction'));
router.post('/transition', routeToScript('transition'));
router.post('/closing', routeToScript('closing'));
router.post('/filler', routeToScript('filler'));
router.post('/emergency', routeToScript('emergency'));
router.post('/delay', routeToScript('delay'));
router.post('/announcement', routeToScript('announcement'));

export default router;

