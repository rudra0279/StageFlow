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
    const { eventId, sessionId, scriptType, tone = 'professional', customParams = {} } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    let session = null;
    let speaker = null;

    if (sessionId) {
      session = await Session.findById(sessionId).populate('speakerId');
      speaker = session?.speakerId;
    }

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

    switch (scriptType) {
      case 'opening':
        prompt = buildOpeningPrompt(event, tone);
        break;
      case 'introduction':
        prompt = buildSpeakerIntroPrompt(event, session, speaker, tone);
        break;
      case 'transition': {
        const nextSession = await Session.findOne({
          eventId,
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
        return res.status(400).json({ success: false, message: `Unknown scriptType: ${scriptType}` });
    }

    const result = await generateAIScript({
      eventId,
      sessionId,
      scriptType,
      prompt,
      contextData,
      tone
    });

    // Auto-save generated script to session if session exists
    if (sessionId && scriptType !== 'copilot') {
      await saveSessionScript(sessionId, scriptType, result.script);
    }

    res.status(200).json({
      success: true,
      data: result
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
