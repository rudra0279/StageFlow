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

export const generateScript = async (req, res, next) => {
  try {
    let { eventId, sessionId, scriptType, type, tone = 'professional', customParams = {} } = req.body;

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
    const { eventId, sessionId, query, speechContext, speechTracking } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const event = await Event.findById(eventId);
    let session = null;
    let speaker = null;

    if (sessionId) {
      session = await Session.findById(sessionId).populate('speakerId');
      speaker = session?.speakerId;
    }

    let nextSession = null;
    if (session) {
      nextSession = await Session.findOne({
        eventId,
        orderIndex: { $gt: session.orderIndex || 0 }
      }).populate('speakerId');
    }

    const trackingData = speechContext || speechTracking || null;
    const speechAnalysis = trackingData ? analyzeSpeechTracking(trackingData) : null;

    const prompt = buildCopilotPrompt(
      event,
      session,
      speaker,
      query,
      trackingData,
      nextSession,
      nextSession?.speakerId
    );

    const result = await generateAIScript({
      eventId,
      sessionId,
      scriptType: 'copilot',
      prompt,
      contextData: {
        eventTitle: event?.title,
        speakerName: speaker?.name,
        speakerCompany: speaker?.company,
        speakerPronunciation: speaker?.pronunciationGuide || 'Standard pronunciation',
        theme: event?.theme,
        wordsPerMinute: speechAnalysis?.wordsPerMinute,
        nextLine: speechAnalysis?.nextLine
      },
      tone: 'direct'
    });

    res.status(200).json({
      success: true,
      data: {
        query,
        answer: result.script,
        speechAnalysis,
        provider: result.provider
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

