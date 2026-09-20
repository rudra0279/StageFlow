// src/routes/committeeRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const committeeController = require('../controllers/committeeController');
const { authenticate, requireRole } = require('../middleware/auth');

// Committee routes (organizer & admin access)
const organizerAuth = [
  authenticate,
  requireRole('organizer', 'ORGANIZER', 'admin', 'ADMIN'),
];

router.get('/', ...organizerAuth, committeeController.getCommittee);
router.post('/', ...organizerAuth, committeeController.addCommitteeMember);
router.patch('/:memberId', ...organizerAuth, committeeController.updateCommitteeMember);
router.delete('/:memberId', ...organizerAuth, committeeController.removeCommitteeMember);

module.exports = router;
