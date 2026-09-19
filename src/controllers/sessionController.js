// src/controllers/sessionController.js
const sessionService = require('../services/sessionService');
const { logger } = require('../utils/logger');

async function handleStartSession(req, res, next) {
  try {
    const { eventId, agendaId } = req.params;
    logger.session(`HTTP Start session request: eventId=${eventId}, agendaId=${agendaId}`);

    const result = await sessionService.startSession(eventId, agendaId);
    res.status(200).json({
      success: true,
      message: 'Session started successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function handleCompleteSession(req, res, next) {
  try {
    const { eventId, agendaId } = req.params;
    logger.session(`HTTP Complete session request: eventId=${eventId}, agendaId=${agendaId}`);

    const result = await sessionService.completeSession(eventId, agendaId);
    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function handleSkipSession(req, res, next) {
  try {
    const { eventId, agendaId } = req.params;
    logger.session(`HTTP Skip session request: eventId=${eventId}, agendaId=${agendaId}`);

    const result = await sessionService.skipSession(eventId, agendaId);
    res.status(200).json({
      success: true,
      message: 'Session skipped successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function handleDelaySession(req, res, next) {
  try {
    const { eventId, agendaId } = req.params;
    const { delayMinutes } = req.body;
    const delay = parseInt(delayMinutes, 10) || 10;

    logger.session(`HTTP Delay session request: eventId=${eventId}, agendaId=${agendaId}, delay=+${delay}m`);

    const result = await sessionService.delaySession(eventId, agendaId, delay);
    res.status(200).json({
      success: true,
      message: `Session delayed by +${delay} minutes successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleStartSession,
  handleCompleteSession,
  handleSkipSession,
  handleDelaySession,
};
