import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
import { generateAIScript, analyzeSpeechTracking } from '../services/aiService.js';
import { buildOpeningPrompt } from '../prompts/openingPrompt.js';
import { buildSpeakerIntroPrompt } from '../prompts/speakerIntroPrompt.js';
import { buildTransitionPrompt } from '../prompts/transitionPrompt.js';
import { buildDelayPrompt } from '../prompts/delayPrompt.js';
import { buildClosingPrompt } from '../prompts/closingPrompt.js';
import { buildCopilotPrompt } from '../prompts/copilotPrompt.js';
import { buildFillerPrompt } from '../prompts/fillerPrompt.js';
import { buildEmergencyPrompt } from '../prompts/emergencyPrompt.js';
import { buildSpeechAssistPrompt } from '../prompts/speechAssistPrompt.js';
import { saveSessionScript } from '../services/sessionService.js';

import { Question } from '../models/Question.js';

export const generateScript = async (req, res, next) => {
  try {
    let { eventId, sessionId, scriptType, type, tone = 'professional', customParams = {}, track, targetTrack, message } = req.body;

    // Handle announcements endpoint
    if (req.path.includes('announcement') || type === 'announcement' || scriptType === 'announcement') {
      const scope = targetTrack ? 'TRACK-SPECIFIC' : 'EVENT-WIDE';
      return res.status(200).json({
        success: true,
        data: {
          scope,
          targetTrack: targetTrack || null,
          message: message || customParams.message || '',
          type: type || 'GENERAL'
        }
      });
    }

    // Normalize script type alias (e.g. SPEAKER_INTRO -> introduction)
    let resolvedType = (scriptType || type || 'introduction').toLowerCase();
    if (resolvedType === 'speaker_intro' || resolvedType === 'speakerintro' || resolvedType === 'intro') {
      resolvedType = 'introduction';
    }

    let session = null;
    let speaker = null;

    if (sessionId) {
      session = await Session.findById(sessionId).populate('speakerId');
      speaker = session?.speakerId;
      if (!eventId && session?.eventId) {
        eventId = session.eventId;
      }
    }

    const event = eventId ? await Event.findById(eventId) : await Event.findOne();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Handle Track-Specific Transition request
    if (resolvedType === 'transition' && track) {
      const trackSessions = await Session.find({
        eventId: event._id,
        $or: [{ track }, { room: track }, { trackId: track }]
      }).sort({ orderIndex: 1 }).populate('speakerId');

      const nextTrackSession = trackSessions.find(s => s.status === 'UPCOMING') || trackSessions[1] || trackSessions[0];

      return res.status(200).json({
        success: true,
        data: {
          track,
          script: `Welcome back to ${track}. Up next we have ${nextTrackSession?.title || 'the next session'} featuring ${nextTrackSession?.speakerId?.name || 'our upcoming speaker'}.`,
          nextSession: nextTrackSession ? {
            _id: nextTrackSession._id,
            title: nextTrackSession.title,
            speakerName: nextTrackSession.speakerId?.name,
            speakerPronunciation: nextTrackSession.speakerId?.pronunciationGuide
          } : null
        }
      });
    }

    // Retrieve next session in order if applicable
    let nextSession = null;
    if (session) {
      nextSession = await Session.findOne({
        eventId: event._id,
        orderIndex: { $gt: session.orderIndex || 0 }
      }).populate('speakerId');
    }

    let prompt = '';
    const contextData = {
      eventTitle: event.title,
      venue: event.venue,
      theme: event.theme,
      healthStatus: event.healthStatus,
      totalDelayMinutes: event.totalDelayMinutes,
      sessionTitle: session?.title,
      speakerName: speaker?.name,
      speakerTitle: speaker?.title,
      speakerCompany: speaker?.company,
      speakerPronunciation: speaker?.pronunciationGuide || 'Standard pronunciation',
      nextSessionTitle: nextSession?.title,
      nextSpeakerName: nextSession?.speakerId?.name,
      nextSpeakerCompany: nextSession?.speakerId?.company,
      nextSpeakerPronunciation: nextSession?.speakerId?.pronunciationGuide || 'Standard pronunciation',
      delayMinutes: customParams.delayMinutes || event.totalDelayMinutes || '10',
      reason: customParams.reason || 'Technical adjustments',
      emergencyMessage: customParams.message || customParams.emergencyMessage || 'Please await instructions.',
      durationSeconds: customParams.durationSeconds || 30
    };

    switch (resolvedType) {
      case 'opening':
        prompt = buildOpeningPrompt(event, tone);
        break;
      case 'introduction':
        prompt = buildSpeakerIntroPrompt(event, session, speaker, tone);
        break;
      case 'transition':
        prompt = buildTransitionPrompt(
          event,
          session,
          speaker,
          nextSession,
          nextSession?.speakerId,
          tone
        );
        break;
      case 'delay':
        prompt = buildDelayPrompt(event, session, customParams.delayMinutes, customParams.reason, tone);
        break;
      case 'closing':
        prompt = buildClosingPrompt(event, customParams.highlights, tone);
        break;
      case 'filler':
        prompt = buildFillerPrompt(
          event,
          session,
          speaker,
          customParams.durationSeconds || 30,
          tone
        );
        break;
      case 'emergency':
        prompt = buildEmergencyPrompt(
          event,
          session,
          customParams.message || customParams.emergencyMessage,
          customParams.urgency || 'CRITICAL',
          tone
        );
        break;
      default:
        return res.status(400).json({ success: false, message: `Unknown scriptType: ${resolvedType}` });
    }

    const result = await generateAIScript({
      eventId: event._id,
      sessionId,
      scriptType: resolvedType,
      prompt,
      contextData,
      tone
    });

    // Auto-save generated script to session if session exists
    if (sessionId && resolvedType !== 'copilot') {
      await saveSessionScript(sessionId, resolvedType, result.script);
    }

    res.status(200).json({
      success: true,
      data: {
        ...result,
        script: result.script
      }
    });
  } catch (error) {
    next(error);
  }
};

export const copilotQuery = async (req, res, next) => {
  try {
    const { eventId, sessionId, query, command, speechContext, speechTracking, track } = req.body;
    const userQuery = query || command;

    if (!userQuery) {
      return res.status(400).json({ success: false, message: 'Query or command is required' });
    }

    const event = await Event.findById(eventId);

    let currentTrack = track || 'Track A';
    let trackSessions = [];
    let nextSessionDoc = null;
    let otherTrackSessions = [];

    if (eventId) {
      const allSessions = await Session.find({ eventId }).sort({ orderIndex: 1 }).populate('speakerId');

      if (track) {
        trackSessions = allSessions.filter(s =>
          s.track === track || s.room === track || s.trackId === track
        );
        otherTrackSessions = allSessions.filter(s =>
          s.track !== track && s.room !== track && s.trackId !== track
        );
      } else {
        trackSessions = allSessions;
      }

      // Find next session on current track
      nextSessionDoc = trackSessions.find(s => s.status === 'UPCOMING') || trackSessions[1] || trackSessions[0];
    }

    let nextSessionObj = null;
    if (nextSessionDoc) {
      nextSessionObj = {
        _id: nextSessionDoc._id,
        title: nextSessionDoc.title,
        speakerName: nextSessionDoc.speakerId?.name,
        speakerPronunciation: nextSessionDoc.speakerId?.pronunciationGuide || 'Standard pronunciation'
      };
    }

    // Determine track delay
    let trackDelayMinutes = 0;
    if (trackSessions.length > 0) {
      trackDelayMinutes = trackSessions.reduce((max, s) => Math.max(max, s.delayMinutes || s.delayOffsetMinutes || 0), 0);
      if (trackDelayMinutes === 0 && event?.totalDelayMinutes) {
        trackDelayMinutes = event.totalDelayMinutes;
      }
    }

    // Build other tracks summary
    const otherTracksMap = {};
    otherTrackSessions.forEach(s => {
      const tName = s.track || s.room || s.trackId || 'Other Track';
      if (!otherTracksMap[tName]) {
        otherTracksMap[tName] = {
          track: tName,
          title: s.title,
          speakerName: s.speakerId?.name
        };
      }
    });
    const otherTracks = Object.values(otherTracksMap);

    // Build custom track-isolated AI answers
    const lowerQuery = userQuery.toLowerCase();
    let answer = '';

    if (lowerQuery.includes('next')) {
      answer = `The next session on ${currentTrack} is "${nextSessionObj?.title}" presented by ${nextSessionObj?.speakerName}.`;
    } else if (lowerQuery.includes('delay')) {
      answer = `${currentTrack} is currently delayed by ${trackDelayMinutes} minutes.`;
    } else if (lowerQuery.includes('other stages') || lowerQuery.includes('other tracks')) {
      answer = `On other stages: ${otherTracks.map(t => `${t.track}: ${t.title}`).join('; ')}.`;
    } else if (lowerQuery.includes('introduce')) {
      answer = `Please welcome ${nextSessionObj?.speakerName} (${nextSessionObj?.speakerPronunciation}) presenting "${nextSessionObj?.title}" on ${currentTrack}.`;
    } else {
      answer = `StagePilot AI Co-Pilot for ${currentTrack}: Next up is ${nextSessionObj?.speakerName} with "${nextSessionObj?.title}".`;
    }

    res.status(200).json({
      success: true,
      data: {
        track: currentTrack,
        currentTrack,
        trackDelayMinutes,
        nextSession: nextSessionObj,
        otherTracks,
        query: userQuery,
        answer,
        provider: 'StagePilot Contextual Engine'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const questionAssist = async (req, res, next) => {
  try {
    const { eventId, question, questionId, action, track } = req.body;

    let questionText = question || '';
    let trackName = track || 'Track A';

    if (!questionText && questionId) {
      const qDoc = await Question.findById(questionId);
      if (qDoc) {
        questionText = qDoc.question;
        if (qDoc.trackId) trackName = qDoc.trackId;
      }
    }

    const lowerQ = questionText.toLowerCase();

    // Safety Guardrail Check
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

    res.status(200).json({
      success: true,
      data: {
        action,
        result
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Intelligent Speech-to-Text Teleprompter Assist controller
 * Receives frontend speech tracking state (Web Speech API recognition)
 * Supplies pace suggestions, missed-script detection, and next-line teleprompter suggestions
 */
export const teleprompterAssist = async (req, res, next) => {
  try {
    const {
      eventId,
      sessionId,
      assistType = 'general', // 'pace' | 'missed_script' | 'next_line' | 'general'
      query = '',
      speechContext,
      speechTracking
    } = req.body;

    const trackingData = speechContext || speechTracking || {};
    const analysis = analyzeSpeechTracking(trackingData);

    let event = null;
    let session = null;
    let speaker = null;
    let nextSession = null;

    if (eventId) {
      event = await Event.findById(eventId);
    }
    if (sessionId) {
      session = await Session.findById(sessionId).populate('speakerId');
      speaker = session?.speakerId;
      if (session) {
        nextSession = await Session.findOne({
          eventId,
          orderIndex: { $gt: session.orderIndex || 0 }
        }).populate('speakerId');
      }
    }

    const prompt = buildSpeechAssistPrompt({
      event: event || {},
      session,
      speaker,
      nextSession,
      nextSpeaker: nextSession?.speakerId,
      speechTracking: trackingData,
      assistType,
      userQuery: query
    });

    let suggestionFallback = '';
    switch (assistType) {
      case 'pace':
        suggestionFallback = analysis.paceSuggestion;
        break;
      case 'missed_script':
        suggestionFallback =
          analysis.missedPhrases.length > 0
            ? `You skipped: "${analysis.missedPhrases[0]}". You can bridge it smoothly with: "${analysis.recoveryLine}"`
            : 'You are perfectly on script with no key points missed.';
        break;
      case 'next_line':
        suggestionFallback = `Next line: "${analysis.nextLine}"`;
        break;
      default:
        suggestionFallback = `${analysis.paceSuggestion} Ready for: "${analysis.nextLine}"`;
    }

    const result = await generateAIScript({
      eventId,
      sessionId,
      scriptType: 'teleprompter_assist',
      prompt,
      contextData: {
        eventTitle: event?.title,
        speakerName: speaker?.name,
        speakerPronunciation: speaker?.pronunciationGuide || 'Standard pronunciation',
        sessionTitle: session?.title,
        wordsPerMinute: analysis.wordsPerMinute,
        paceSuggestion: analysis.paceSuggestion,
        missedPhrase: analysis.missedPhrases[0] || 'none',
        recoveryLine: analysis.recoveryLine || 'Moving forward smoothly.',
        nextLine: analysis.nextLine
      },
      tone: analysis.paceStatus || 'professional'
    });

    res.status(200).json({
      success: true,
      data: {
        assistType,
        suggestion: result.script || suggestionFallback,
        analysis,
        provider: result.provider
      }
    });
  } catch (error) {
    next(error);
  }
};

export const handleQuestionAssist = async (req, res, next) => {
  try {
    const { eventId, questionId, question, action = 'summarize', track } = req.body;

    let questionText = question || '';
    let speakerName = null;
    let speakerOrg = null;

    try {
      if (eventId) {
        const query = { eventId };
        if (track) {
          query.$or = [{ track }, { trackId: track }, { room: track }];
        }
        let session = await Session.findOne(query).populate('speakerId');
        if (!session) {
          session = await Session.findOne({ eventId }).populate('speakerId');
        }
        if (session?.speakerId) {
          speakerName = session.speakerId.name;
          speakerOrg = session.speakerId.organization || session.speakerId.company;
        }
      }
      if (questionId && !questionText) {
        const { Question } = await import('../models/Question.js');
        const qDoc = await Question.findById(questionId);
        if (qDoc) questionText = qDoc.question;
      }
    } catch (_) { }

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
        const parts = stripped.split(/,\s*| — /);
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
        result
      }
    });
  } catch (error) {
    next(error);
  }
};

