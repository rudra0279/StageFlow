// src/routes/agendaRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const agendaController = require('../controllers/agendaController');
const { authenticate } = require('../middleware/auth');

router.route('/')
  .post(authenticate, agendaController.createAgendaItem)
  .get(agendaController.getAgenda);

router.route('/:id')
  .put(authenticate, agendaController.updateAgendaItem)
  .delete(authenticate, agendaController.deleteAgendaItem);

module.exports = router;
