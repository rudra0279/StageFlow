// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const { authenticate, requireRole } = require('../middleware/auth');

const organizerAuth = [
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
];

router.get('/', authenticate, taskController.getTasks);
router.post('/', ...organizerAuth, taskController.createTask);
router.get('/eligible-assignees', authenticate, taskController.getEligibleAssignees);
router.get('/suggestions', authenticate, taskController.getTaskSuggestions);
router.post('/suggestions/confirm', ...organizerAuth, taskController.confirmTaskSuggestions);
router.patch('/:taskId', ...organizerAuth, taskController.updateTask);
router.patch('/:taskId/status', authenticate, taskController.updateTask);
router.delete('/:taskId', ...organizerAuth, taskController.deleteTask);

module.exports = router;
