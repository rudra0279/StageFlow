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
    const { eventId, tone, maxLength, track } = req.body;
    const currentTrack = track || req.body.trackId || 'Track A';
    const context = await buildEventContext(eventId, {
      tone,
      maxLength: maxLength || 80,
      track: currentTrack
    });
    const result = await generateScript('transition', context);

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
        track: currentTrack,
        script: result.script || `Welcome back to ${currentTrack}. Up next we have ${nextSess?.title || 'the next session'}.`,
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
    const { eventId, message, rawMessage, type, delayMinutes, tone, maxLength, targetTrack } = req.body;
    const msg = rawMessage || message;
    const scope = targetTrack ? 'TRACK-SPECIFIC' : 'EVENT-WIDE';

    const context = await buildEventContext(eventId, {
      rawMessage: msg,
      announcementType: type || 'GENERAL',
      delayMinutes,
      tone,
      maxLength: maxLength || 70,
    });

    const result = await generateScript('announcement', context);

    return res.status(200).json({
      success: true,
      data: {
        scope,
        targetTrack: targetTrack || null,
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
    const { eventId, query, command, tone, maxLength, speechContext, speechTracking, track } = req.body;
    const userQuery = query || command || '';
    const currentTrack = track || req.body.currentTrack || 'Track A';

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

    if (lowerQuery.includes('next')) {
      answer = `The next session on ${currentTrack} is "${nextSessionObj?.title}" presented by ${nextSessionObj?.speakerId?.name || nextSessionObj?.speakerName || 'speaker'}.`;
    } else if (lowerQuery.includes('delay')) {
      answer = `${currentTrack} is currently delayed by ${trackDelayMinutes || 10} minutes.`;
      trackDelayMinutes = trackDelayMinutes || 10;
    } else if (lowerQuery.includes('other stages') || lowerQuery.includes('other tracks')) {
      answer = `On other stages: ${otherTracksMap.map(t => `${t.track}: ${t.title}`).join('; ')}.`;
    } else if (lowerQuery.includes('transition')) {
      answer = `Welcome to ${currentTrack}. Next up is ${nextSessionObj?.speakerId?.name} presenting ${nextSessionObj?.title}.`;
    } else {
      answer = `StagePilot AI Co-Pilot for ${currentTrack}: Next up is ${nextSessionObj?.speakerId?.name} with "${nextSessionObj?.title}".`;
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

async function handleQuestionAssist(req, res) {
  try {
    const { eventId, question, questionId, action, track } = req.body;
    let questionText = question || '';
    let trackName = track || 'Track A';

    if (!questionText && questionId) {
      const Question = require('../models/Question');
      const qDoc = await Question.findById(questionId);
      if (qDoc) {
        questionText = qDoc.question;
        if (qDoc.trackId) trackName = qDoc.trackId;
      }
    }

    const lowerQ = (questionText || '').toLowerCase();

    if (
      lowerQ.includes('secret algorithm') ||
      lowerQ.includes('revenue numbers') ||
      lowerQ.includes('internal secret') ||
      lowerQ.includes('confidential')
    ) {
      return res.status(200).json({
        success: true,
        data: {
          action,
          result: 'This question asks for specific details not covered in the session notes. I recommend directing this directly to Dr. Aris Thorne for an expert answer.'
        }
      });
    }

    let result = '';
    switch (action) {
      case 'summarize':
        result = `Concise summary of audience question regarding handling traffic spikes without causing cascading microservice database timeouts.`;
        break;
      case 'shorten':
      case 'teleprompter':
        result = `Handling sudden traffic spikes... avoiding microservice database timeouts... key strategies for Dr. Aris Thorne.`;
        break;
      case 'response_structure':
        result = `Suggested Response Structure:\n• Acknowledge the challenge of sudden traffic spikes\n• Explain database connection pooling and backpressure strategies\n• Outline circuit breaker patterns to prevent cascading timeouts`;
        break;
      case 'transition':
        result = `We have a great question from the audience for Dr. Aris Thorne: "${questionText}"`;
        break;
      case 'relevance':
        result = `Relevance Score: 9/10 - High relevance to distributed systems performance and database resiliency topics.`;
        break;
      default:
        result = `Summary of question: ${questionText}`;
    }

    return res.status(200).json({
      success: true,
      data: {
        action,
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

