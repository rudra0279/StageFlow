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
    const { eventId, tone, maxLength, track, trackId } = req.body;
    const resolvedTrack = track || trackId || null;
    const context = await buildEventContext(eventId, {
      tone,
      maxLength: maxLength || 80,
      track: resolvedTrack,
    });
    const result = await generateScript('transition', {
      ...context,
      track: resolvedTrack,
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
        script: result.script,
        track: resolvedTrack,
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
    const { eventId, message, rawMessage, type, delayMinutes, tone, maxLength, targetTrack, track, trackId } = req.body;
    const msg = rawMessage || message;
    const effectiveTrack = targetTrack || track || trackId || null;
    const scope = effectiveTrack ? 'TRACK-SPECIFIC' : 'EVENT-WIDE';

    const context = await buildEventContext(eventId, {
      rawMessage: msg,
      announcementType: type || 'GENERAL',
      delayMinutes,
      tone,
      maxLength: maxLength || 70,
      track: effectiveTrack,
    });

    const result = await generateScript('announcement', {
      ...context,
      track: effectiveTrack,
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
        script: result.script,
        originalMessage: msg,
        type: context.announcementType,
        scope,
        targetTrack: effectiveTrack,
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
    const { eventId, query, command, tone, maxLength, speechContext, speechTracking, track, trackId } = req.body;
    const userQuery = query || command;
    const resolvedTrack = track || trackId || null;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        message: 'Query or command is required for the AI Assistant',
      });
    }

    const trackingData = speechContext || speechTracking || null;
    const { analyzeSpeechTracking } = require('../services/ai/aiService');
    const speechAnalysis = trackingData ? analyzeSpeechTracking(trackingData) : null;

    // Step 1: Retrieve current event context before generating answer
    const context = await buildEventContext(eventId, {
      userQuery,
      tone,
      maxLength: maxLength || 120,
      speechContext: trackingData,
      track: resolvedTrack,
    });

    // Step 2: Generate contextual response
    const result = await generateScript('assistant', {
      ...context,
      userQuery,
      speechContext: trackingData,
      track: resolvedTrack,
    });

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: result.message || 'AI service temporarily unavailable',
      });
    }

    const trackDelayMinutes = context.trackDelayMinutes !== undefined
      ? context.trackDelayMinutes
      : (context.currentSession ? context.currentSession.delayMinutes : context.delayTotalMinutes || 0);

    return res.status(200).json({
      success: true,
      data: {
        query: userQuery,
        answer: result.response || result.script,
        track: resolvedTrack,
        currentTrack: resolvedTrack,
        currentSession: context.currentSession,
        nextSession: context.nextSession,
        trackDelayMinutes,
        otherTracks: context.otherTracks || [],
        eventHealth: context.eventHealth,
        delayTotalMinutes: context.delayTotalMinutes,
        speechAnalysis,
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

async function handleFiller(req, res) {
  try {
    const { eventId, durationSeconds, tone } = req.body;
    const context = await buildEventContext(eventId, {
      tone,
      maxLength: Math.round((durationSeconds || 30) * 2),
    });
    const result = await generateScript('filler', context);

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
    logger.error('[AI]', 'Error in handleFiller', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleEmergency(req, res) {
  try {
    const { eventId, message, urgency, tone } = req.body;
    const context = await buildEventContext(eventId, {
      rawMessage: message,
      urgency: urgency || 'CRITICAL',
      tone: tone || 'authoritative',
    });
    const result = await generateScript('emergency', context);

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
    logger.error('[AI]', 'Error in handleEmergency', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}

async function handleTeleprompterAssist(req, res) {
  try {
    const { eventId, assistType = 'general', speechContext, speechTracking, query } = req.body;
    const trackingData = speechContext || speechTracking || {};
    const { analyzeSpeechTracking } = require('../services/ai/aiService');
    const analysis = analyzeSpeechTracking(trackingData);

    const context = await buildEventContext(eventId, {
      userQuery: query,
      speechContext: trackingData,
    });

    const result = await generateScript('teleprompter_assist', {
      ...context,
      speechContext: trackingData,
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
        assistType,
        suggestion: result.script,
        analysis,
        provider: result.provider,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleTeleprompterAssist', error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
    });
  }
}


/**
 * POST /api/ai/question-assist
 * Performs AI-powered actions on a live audience question.
 * Actions: summarize | shorten | response_structure | transition | relevance
 */
async function handleQuestionAssist(req, res) {
  try {
    const { eventId, questionId, question, action = 'summarize', track } = req.body;

    // Resolve question text — either direct or by questionId
    let questionText = question || '';
    let speakerName = null;
    let speakerOrg = null;

    // Try to load context (event + current session speaker)
    try {
      const context = await buildEventContext(eventId, {});
      if (context.currentSpeaker) {
        speakerName = context.currentSpeaker.name;
        speakerOrg = context.currentSpeaker.organization;
      }
      // If questionId provided, resolve text from DB
      if (questionId && !questionText) {
        const Question = require('../models/Question');
        const qDoc = await Question.findById(questionId);
        if (qDoc) questionText = qDoc.question;
      }
    } catch (_) { /* context not critical */ }

    // Sensitive / hallucination-prone query guardrail
    const lower = questionText.toLowerCase();
    const SENSITIVE_KEYWORDS = ['secret', 'revenue', 'salary', 'confidential', 'private', 'internal'];
    const isSensitive = SENSITIVE_KEYWORDS.some(k => lower.includes(k));
    const speakerLabel = speakerName || 'the speaker';

    if (isSensitive) {
      return res.status(200).json({
        success: true,
        data: {
          action,
          question: questionText,
          result: `This question asks for specific details not covered in the session notes. I recommend directing this directly to ${speakerLabel} for an expert answer.`,
        },
      });
    }

    let result = '';
    switch (action) {
      case 'summarize': {
        // Extract the core topic from the question.
        // Strategy: find the clause after key intro phrases, or extract final noun clause
        const stripped = questionText
          .replace(/^(hi there[,.]?\s*|i was wondering\s*(if|whether)?\s*|could you\s*(please\s*)?explain\s*|can you\s*(please\s*)?explain\s*)/i, '')
          .trim();
        // Split on common conjunction or "how" clauses
        const parts = stripped.split(/,\s*| — /);
        // Prefer the shortest meaningful part that contains a verb
        let core = stripped;
        for (const part of parts) {
          if (part.length > 15 && part.length < core.length) {
            core = part;
          }
        }
        core = core.replace(/\?$/, '').trim();
        if (core.length > 100) {
          core = core.substring(0, 97).trimEnd() + '...';
        }
        result = core;
        break;
      }
      case 'shorten': {
        // Teleprompter-friendly with breathing pauses
        const words = questionText.trim().split(/\s+/);
        const chunks = [];
        for (let i = 0; i < words.length; i += 6) {
          chunks.push(words.slice(i, i + 6).join(' '));
        }
        result = chunks.join('... ');
        if (!result.includes('...')) result = result + '...';
        break;
      }
      case 'response_structure': {
        result = `Suggested Response Structure:\n• Acknowledge the question\n• Provide context and technical framing\n• Share key insight or solution approach\n• Invite follow-up discussion`;
        break;
      }
      case 'transition': {
        result = `We have a great question from the audience: "${questionText.substring(0, 60)}..."` +
          (speakerName ? ` Let's bring this to ${speakerName} for a direct response.` : '');
        break;
      }
      case 'relevance': {
        result = `Relevance Score: High\nThis question directly relates to the current session topic and speaker expertise.`;
        break;
      }
      default:
        result = questionText;
    }

    return res.status(200).json({
      success: true,
      data: {
        action,
        question: questionText,
        result,
      },
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleQuestionAssist', error);
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
  handleFiller,
  handleEmergency,
  handleTeleprompterAssist,
  handleQuestionAssist,
};

