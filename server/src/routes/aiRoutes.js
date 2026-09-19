import express from 'express';
import { generateScript, copilotQuery, teleprompterAssist, questionAssist } from '../controllers/aiController.js';
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
    status: 'ready'
  });
});

// Primary script generation endpoints
router.post('/generate-script', generateScript);
router.post('/generate', generateScript);

// Copilot and AI assistant query endpoints
router.post('/copilot-query', copilotQuery);
router.post('/query', copilotQuery);
router.post('/assistant', copilotQuery);

// Intelligent Teleprompter assistance
router.post('/teleprompter-assist', teleprompterAssist);

// Question assist endpoint
router.post('/question-assist', questionAssist);

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

