import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
import { generateAIScript } from '../services/aiService.js';
import { buildOpeningPrompt } from '../prompts/openingPrompt.js';
import { buildSpeakerIntroPrompt } from '../prompts/speakerIntroPrompt.js';
import { buildTransitionPrompt } from '../prompts/transitionPrompt.js';
import { buildDelayPrompt } from '../prompts/delayPrompt.js';
import { buildClosingPrompt } from '../prompts/closingPrompt.js';
import { buildCopilotPrompt } from '../prompts/copilotPrompt.js';
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

    let prompt = '';
    const contextData = {
      eventTitle: event.title,
      venue: event.venue,
      theme: event.theme,
      sessionTitle: session?.title,
      speakerName: speaker?.name,
      speakerTitle: speaker?.title,
      speakerCompany: speaker?.company,
      delayMinutes: customParams.delayMinutes || '10',
      reason: customParams.reason || 'Technical check'
    };

    switch (resolvedType) {
      case 'opening':
        prompt = buildOpeningPrompt(event, tone);
        break;
      case 'introduction':
        prompt = buildSpeakerIntroPrompt(event, session, speaker, tone);
        break;
      case 'transition': {
        const nextSession = await Session.findOne({
          eventId: event._id,
          orderIndex: { $gt: session?.orderIndex || 0 }
        }).populate('speakerId');

        contextData.nextSessionTitle = nextSession?.title;
        contextData.nextSpeakerName = nextSession?.speakerId?.name;
        contextData.nextSpeakerCompany = nextSession?.speakerId?.company;

        prompt = buildTransitionPrompt(
          event,
          session,
          speaker,
          nextSession,
          nextSession?.speakerId,
          tone
        );
        break;
      }
      case 'delay':
        prompt = buildDelayPrompt(event, session, customParams.delayMinutes, customParams.reason, tone);
        break;
      case 'closing':
        prompt = buildClosingPrompt(event, customParams.highlights, tone);
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
    const { eventId, sessionId, query } = req.body;

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

    const prompt = buildCopilotPrompt(event, session, speaker, query);
    const result = await generateAIScript({
      eventId,
      sessionId,
      scriptType: 'copilot',
      prompt,
      contextData: {
        eventTitle: event?.title,
        speakerName: speaker?.name,
        speakerCompany: speaker?.company,
        theme: event?.theme
      },
      tone: 'direct'
    });

    res.status(200).json({
      success: true,
      data: {
        query,
        answer: result.script,
        provider: result.provider
      }
    });
  } catch (error) {
    next(error);
  }
};
