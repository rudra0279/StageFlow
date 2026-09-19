import express from 'express';
import { generateScript, copilotQuery } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

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
      'POST /api/ai/copilot-query'
    ]
  });
});

router.post('/generate-script', protect, generateScript);
router.post('/generate', protect, generateScript);
router.post('/copilot-query', protect, copilotQuery);
router.post('/query', protect, copilotQuery);

export default router;
