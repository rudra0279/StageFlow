// src/controllers/aiController.js
const { buildEventContext } = require('../services/ai/contextBuilder');
const { generateScript } = require('../services/ai/aiService');
const { logger } = require('../utils/logger');

async function handleOpening(req, res) {
  try {
    const { eventId, tone, maxLength, audience } = req.body;
    const context = await buildEventContext(eventId, { tone, maxLength: maxLength || 150, audience });
    const result = await generateScript('opening', context);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        script: result.script,
        provider: result.provider,
        context: result.context,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleOpening', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleIntroduction(req, res) {
  try {
    const { eventId, speakerId, tone, maxLength } = req.body;
    const context = await buildEventContext(eventId, {
      speakerId,
      tone,
      maxLength: maxLength || 100,
    });
    const result = await generateScript('introduction', context);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        script: result.script,
        speaker: context.currentSpeaker,
        session: context.currentSession,
        provider: result.provider,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleIntroduction', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleTransition(req, res) {
  try {
    const { eventId, tone, maxLength } = req.body;
    const context = await buildEventContext(eventId, {
      tone,
      maxLength: maxLength || 80,
    });
    const result = await generateScript('transition', context);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        script: result.script,
        currentSession: context.currentSession,
        nextSession: context.nextSession,
        provider: result.provider,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleTransition', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleClosing(req, res) {
  try {
    const { eventId, tone, maxLength } = req.body;
    const context = await buildEventContext(eventId, {
      tone,
      maxLength: maxLength || 120,
    });
    const result = await generateScript('closing', context);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        script: result.script,
        provider: result.provider,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleClosing', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleAnnouncement(req, res) {
  try {
    const { eventId, message, rawMessage, type, delayMinutes, tone, maxLength } = req.body;
    const msg = rawMessage || message;

    const context = await buildEventContext(eventId, {
      rawMessage: msg,
      announcementType: type || 'GENERAL',
      delayMinutes,
      tone,
      maxLength: maxLength || 70,
    });

    const result = await generateScript('announcement', context);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        script: result.script,
        originalMessage: msg,
        type: context.announcementType,
        provider: result.provider,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleAnnouncement', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleAssistant(req, res) {
  try {
    const { eventId, query, command, tone, maxLength } = req.body;
    const userQuery = query || command;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        message: 'Query or command is required for the AI Assistant',
      });
    }

    // Step 1: Retrieve current event context before generating answer
    const context = await buildEventContext(eventId, {
      userQuery,
      tone,
      maxLength: maxLength || 120,
    });

    // Step 2: Generate contextual response
    const result = await generateScript('assistant', {
      ...context,
      userQuery,
    });

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        query: userQuery,
        answer: result.response || result.script,
        currentSession: context.currentSession,
        nextSession: context.nextSession,
        eventHealth: context.eventHealth,
        delayTotalMinutes: context.delayTotalMinutes,
        provider: result.provider,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleAssistant', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

module.exports = {
  handleOpening,
  handleIntroduction,
  handleTransition,
  handleClosing,
  handleAnnouncement,
  handleAssistant,
};
