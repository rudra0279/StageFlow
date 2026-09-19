import express from 'express';
import {
  getAgenda,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem
} from '../controllers/agendaController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAgenda)
  .post(protect, authorize('organizer'), createAgendaItem);

router.route('/:id')
  .patch(protect, authorize('organizer'), updateAgendaItem)
  .delete(protect, authorize('organizer'), deleteAgendaItem);

export default router;
