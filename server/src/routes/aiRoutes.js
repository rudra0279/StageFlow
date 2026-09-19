import express from 'express';
import { generateScript, copilotQuery } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-script', protect, generateScript);
router.post('/copilot-query', protect, copilotQuery);

export default router;
