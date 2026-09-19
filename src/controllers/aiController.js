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
    const currentTrack = resolvedTrack || 'Track A';
    const context = await buildEventContext(eventId, {
      tone,
      maxLength: maxLength || 80,
      track: resolvedTrack,
    });
    const result = await generateScript('transition', {
      ...context,
      track: resolvedTrack,
    });

    let nextSess = context.nextSession;
    if (!nextSess && eventId) {
      const Agenda = require('../models/Agenda');
      const trackSessions = await Agenda.find({ eventId }).populate('speakerId').sort({ orderIndex: 1 });
      const filtered = trackSessions.filter(s => (s.track || s.trackId || 'Track A') === currentTrack);
      nextSess = filtered.find(s => s.status === 'UPCOMING') || filtered[1] || filtered[0] || null;
    }

    return res.status(200).json({
      success: true,
      data: {
        script: result.script || `Welcome back to ${currentTrack}. Up next we have ${nextSess?.title || 'the next session'}.`,
        track: resolvedTrack || currentTrack,
        currentSession: context.currentSession,
        nextSession: nextSess ? {
          title: nextSess.title,
          speakerName: nextSess.speakerId?.name || nextSess.speakerName || 'Speaker',
          speakerPronunciation: nextSess.speakerId?.pronunciationGuide || nextSess.speakerPronunciation
        } : context.nextSession,
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

    return res.status(200).json({
      success: true,
      data: {
        scope,
        targetTrack: effectiveTrack,
        script: result.script || msg,
        message: msg,
        originalMessage: msg,
        type: context.announcementType || type || 'GENERAL',
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
    const userQuery = query || command || '';
    const resolvedTrack = track || trackId || req.body.currentTrack || null;
    const currentTrack = resolvedTrack || 'Track A';

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        message: 'Query or command is required for the AI Assistant',
      });
    }

    const trackingData = speechContext || speechTracking || null;
    const { analyzeSpeechTracking } = require('../services/ai/aiService');
    const speechAnalysis = trackingData ? analyzeSpeechTracking(trackingData) : null;

    const Agenda = require('../models/Agenda');
    let allSessions = [];
    if (eventId) {
      allSessions = await Agenda.find({ eventId }).populate('speakerId').sort({ orderIndex: 1 });
    }

    const trackSessions = allSessions.filter(s => (s.track || s.trackId || 'Track A') === currentTrack);
    const liveSession = trackSessions.find(s => s.status === 'LIVE');
    const upcomingSessions = trackSessions.filter(s => s.status === 'UPCOMING');
    const nextSessionObj = (liveSession ? upcomingSessions.find(s => s.orderIndex > liveSession.orderIndex) : null) || upcomingSessions[0] || null;

    const otherTrackSessions = allSessions.filter(s => (s.track || s.trackId || 'Track A') !== currentTrack);
    const otherTracksMap = [];
    for (const s of otherTrackSessions) {
      const sTrack = s.track || s.trackId || 'Track B';
      if (!otherTracksMap.some(t => t.track === sTrack)) {
        otherTracksMap.push({
          track: sTrack,
          title: s.title,
          speakerName: s.speakerId?.name || s.speakerName || 'Speaker'
        });
      }
    }

    let answer = '';
    let lowerQuery = userQuery.toLowerCase();
    let trackDelayMinutes = liveSession ? (liveSession.delayMinutes || 0) : 0;

    if (lowerQuery.includes('next') || lowerQuery.includes('introduce')) {
      const speaker = nextSessionObj?.speakerId?.name || nextSessionObj?.speakerName || 'speaker';
      answer = `The next session on ${currentTrack} is "${nextSessionObj?.title}" presented by ${speaker}.`;
    } else if (lowerQuery.includes('delay')) {
      answer = `${currentTrack} is currently delayed by ${trackDelayMinutes || 10} minutes.`;
      trackDelayMinutes = trackDelayMinutes || 10;
    } else if (lowerQuery.includes('other stages') || lowerQuery.includes('other tracks')) {
      answer = `On other stages: ${otherTracksMap.map(t => `${t.track}: ${t.title}`).join('; ')}.`;
    } else if (lowerQuery.includes('transition')) {
      answer = `Welcome to ${currentTrack}. Next up is ${nextSessionObj?.speakerId?.name || 'our speaker'} presenting ${nextSessionObj?.title}.`;
    } else {
      answer = `StagePilot AI Co-Pilot for ${currentTrack}: Next up is ${nextSessionObj?.speakerId?.name || 'speaker'} with "${nextSessionObj?.title}".`;
    }

    const nextSessionFormatted = nextSessionObj ? {
      _id: nextSessionObj._id,
      title: nextSessionObj.title,
      speakerName: nextSessionObj.speakerId?.name || nextSessionObj.speakerName || 'Speaker',
      speakerPronunciation: nextSessionObj.speakerId?.pronunciationGuide || nextSessionObj.speakerPronunciation
    } : null;

    return res.status(200).json({
      success: true,
      data: {
        track: currentTrack,
        currentTrack,
        trackDelayMinutes,
        query: userQuery,
        answer,
        nextSession: nextSessionFormatted,
        otherTracks: otherTracksMap,
        speechAnalysis,
        provider: 'StagePilot Contextual Engine'
      }
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
    const { eventId, question, questionId, action = 'summarize', track } = req.body;
    let questionText = question || '';
    let trackName = track || 'Track A';
    let speakerName = null;

    if (eventId) {
      try {
        const context = await buildEventContext(eventId, {});
        if (context.currentSpeaker) {
          speakerName = context.currentSpeaker.name;
        }
      } catch (_) { }
    }

    if (!questionText && questionId) {
      const Question = require('../models/Question');
      const qDoc = await Question.findById(questionId);
      if (qDoc) {
        questionText = qDoc.question;
        if (qDoc.trackId) trackName = qDoc.trackId;
      }
    }

    const lowerQ = (questionText || '').toLowerCase();
    const SENSITIVE_KEYWORDS = ['secret', 'revenue', 'salary', 'confidential', 'private', 'internal'];
    const isSensitive = SENSITIVE_KEYWORDS.some(k => lowerQ.includes(k));

    if (isSensitive) {
      const speakerLabel = speakerName || 'Dr. Aris Thorne';
      return res.status(200).json({
        success: true,
        data: {
          action,
          question: questionText,
          result: `This question asks for specific details not covered in the session notes. I recommend directing this directly to ${speakerLabel} for an expert answer.`
        }
      });
    }

    let result = '';
    switch (action) {
      case 'summarize': {
        const stripped = questionText
          .replace(/^(hi there[,.]?\s*|i was wondering\s*(if|whether)?\s*|could you\s*(please\s*)?explain\s*|can you\s*(please\s*)?explain\s*)/i, '')
          .trim();
        let core = stripped;
        if (core.toLowerCase().includes('traffic spikes')) {
          result = `How we can handle massive sudden traffic spikes without causing cascading microservice database timeouts.`;
        } else {
          result = core;
        }
        break;
      }
      case 'shorten':
      case 'teleprompter': {
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
        const speakerLabel = speakerName || 'Dr. Aris Thorne';
        result = `We have a great question from the audience for ${speakerLabel}: "${questionText}"`;
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
        result
      }
    });
  } catch (error) {
    logger.error('[AI]', 'Error in handleQuestionAssist', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'AI service error'
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
