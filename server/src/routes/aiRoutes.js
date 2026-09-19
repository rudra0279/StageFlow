import express from 'express';
import { generateScript, copilotQuery, teleprompterAssist } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-script', protect, generateScript);
router.post('/copilot-query', protect, copilotQuery);
router.post('/teleprompter-assist', protect, teleprompterAssist);

export default router;

