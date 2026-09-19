import express from 'express';
import {
  getAgenda,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem
} from '../controllers/agendaController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.route('/')
  .get(protect, getAgenda)
  .post(protect, authorize(ROLES.ORGANIZER), createAgendaItem);

router.route('/:id')
  .patch(protect, authorize(ROLES.ORGANIZER), updateAgendaItem)
  .delete(protect, authorize(ROLES.ORGANIZER), deleteAgendaItem);

export default router;
