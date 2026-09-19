// src/services/ai/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const env = require('../../config/env');
const { logger } = require('../../utils/logger');
const { buildPrompt } = require('./promptBuilder');

let geminiClient = null;
let openaiClient = null;

function getGeminiClient() {
  if (!geminiClient && env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

function getOpenAIClient() {
  if (!openaiClient && env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Analyze speech recognition tracking against script and calculate pace/progress (CommonJS)
 */
function analyzeSpeechTracking(speechTracking = {}) {
  const recognizedText = (speechTracking.recognizedText || '').trim();
  const currentScript = (speechTracking.currentScript || '').trim();
  const elapsedSeconds = Math.max(Number(speechTracking.elapsedSeconds) || 0, 0);

  const words = recognizedText.length > 0 ? recognizedText.split(/\s+/).filter(Boolean) : [];
  const wordsSpoken = words.length;

  const minutes = Math.max(elapsedSeconds / 60, 0.1);
  const wordsPerMinute = elapsedSeconds >= 3 ? Math.round(wordsSpoken / minutes) : 140;

  let paceStatus = 'pace_good';
  let paceSuggestion = `Pacing is steady at ${wordsPerMinute} words per minute. Maintain this clear, comfortable stage cadence.`;

  if (elapsedSeconds >= 8) {
    if (wordsPerMinute > 165) {
      paceStatus = 'pace_fast';
      paceSuggestion = `Speaking at ${wordsPerMinute} WPM (rapid). Take a conscious breath and pause briefly after key sentences.`;
    } else if (wordsPerMinute < 115) {
      paceStatus = 'pace_slow';
      paceSuggestion = `Speaking at ${wordsPerMinute} WPM (slow). Gently increase momentum to stay aligned with the teleprompter.`;
    }
  }

  const scriptSentences = currentScript
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let nextLine = '';
  let missedPhrases = [];
  let recoveryLine = '';

  if (scriptSentences.length > 0) {
    const recognizedLower = recognizedText.toLowerCase();
    let lastMatchedIndex = -1;

    for (let i = 0; i < scriptSentences.length; i++) {
      const sentence = scriptSentences[i];
      const keyWords = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
      const matches = keyWords.filter((w) => recognizedLower.includes(w));
      if (matches.length >= Math.min(2, keyWords.length)) {
        lastMatchedIndex = i;
      }
    }

    if (lastMatchedIndex >= 0 && lastMatchedIndex < scriptSentences.length - 1) {
      nextLine = scriptSentences[lastMatchedIndex + 1];
    } else if (lastMatchedIndex === -1 && scriptSentences.length > 0) {
      nextLine = scriptSentences[0];
    }

    for (let i = 0; i < lastMatchedIndex; i++) {
      const sentence = scriptSentences[i];
      const keyWords = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 4);
      const matched = keyWords.some((w) => recognizedLower.includes(w));
      if (!matched && keyWords.length > 0) {
        missedPhrases.push(sentence);
      }
    }

    if (missedPhrases.length > 0) {
      recoveryLine = `And critically: ${missedPhrases[0]}`;
    }
  }

  return {
    wordsSpoken,
    elapsedSeconds,
    wordsPerMinute,
    paceStatus,
    paceSuggestion,
    missedPhrases,
    recoveryLine,
    nextLine: nextLine || 'Continue according to the teleprompter cue.'
  };
}

/**
 * Deterministic fallback generator based on rich context when API keys are absent or in sandbox mode.
 */
function generateContextualFallback(type, context) {
  const event = context.eventName || 'the event';
  const current = context.currentSession ? context.currentSession.title : 'the current session';
  const speaker = context.currentSpeaker ? `${context.currentSpeaker.name}` : 'our esteemed speaker';
  const pronunciation = context.currentSpeaker && context.currentSpeaker.pronunciationGuide
    ? ` [${context.currentSpeaker.pronunciationGuide}]`
    : '';
  const next = context.nextSession ? context.nextSession.title : 'our next session';
  const nextSpeaker = context.nextSession && context.nextSession.speakerName ? `with ${context.nextSession.speakerName}` : '';
  const nextPronunciation = context.nextSession && context.nextSession.speakerPronunciation
    ? ` [${context.nextSession.speakerPronunciation}]`
    : '';
  const delay = context.delayMinutes || context.delayTotalMinutes || 10;
  const speechTracking = context.speechContext || {};
  const analysis = analyzeSpeechTracking(speechTracking);

  switch (type) {
    case 'opening':
      return `Good morning, ladies and gentlemen, innovators and guests! Welcome to ${event} here at ${context.venue || 'the venue'}. Today is all about creativity, collaboration, and pushing boundaries. Get ready for an electrifying journey!`;
    case 'introduction':
      return `It is an absolute honor to introduce our distinguished guest, ${speaker}${pronunciation}${context.currentSpeaker && context.currentSpeaker.designation ? `, ${context.currentSpeaker.designation}` : ''}. Today, they will share profound insights on "${current}". Please join me in giving a warm round of applause to welcome ${speaker} to the stage!`;
    case 'transition':
      return `A tremendous thank you to ${speaker} for that inspiring session on "${current}". As we transition, prepare yourselves for "${next}" ${nextSpeaker}${nextPronunciation}. Take a breath, reset, and let's keep the momentum going!`;
    case 'announcement':
      if (context.delayMinutes || (context.scheduleChanges && context.scheduleChanges.length > 0)) {
        return `Attention please! We have a quick update: session "${current}" is extended by approximately ${delay} minutes. Please enjoy this brief pause to grab a beverage and network. We will resume promptly!`;
      }
      return `Attention all attendees: ${context.rawMessage || context.message || 'Please take note of the schedule updates on your dashboard.'}`;
    case 'closing':
      return `What an unbelievable journey ${event} has been! On behalf of the entire organizing committee, thank you to all participants, judges, sponsors, and mentors. Keep innovating and building. Until next time, travel safe and goodbye!`;
    case 'filler':
      return `While our stage production team prepares for "${current}", let's take a moment to reflect on the inspiring discussions here at ${event}. Check the agenda on your screens, and we will resume in just a moment!`;
    case 'emergency':
      return `Attention all attendees: may I have your immediate focus on the main stage. ${context.rawMessage || context.message || 'Please remain seated and follow stage directions as our crew handles a brief update.'} Thank you for your cooperation.`;
    case 'teleprompter_assist':
      return `${analysis.paceSuggestion} Next line cue: "${analysis.nextLine}"`;
    case 'assistant': {
      const q = (context.userQuery || '').toLowerCase();
      if (q.includes('pace') || q.includes('speed')) {
        return analysis.paceSuggestion;
      }
      if (q.includes('miss') || q.includes('skipped')) {
        return analysis.missedPhrases.length > 0
          ? `You bypassed: "${analysis.missedPhrases[0]}". Smoothly say: "${analysis.recoveryLine}"`
          : 'You are on track with no lines skipped.';
      }
      if (q.includes('next line') || q.includes('next sentence')) {
        return `Next line: "${analysis.nextLine}"`;
      }
      if (q.includes('next')) {
        return `Next up is "${next}" ${nextSpeaker}${nextPronunciation} in room ${context.nextSession ? context.nextSession.room || 'Main Stage' : 'Main Stage'}. Event status is currently ${context.eventHealth}.`;
      }
      if (q.includes('speaker') || q.includes('introduce')) {
        return `Coming up next: ${nextSpeaker || speaker}${nextPronunciation || pronunciation}. An accomplished leader ready to enlighten us on "${next}". Let's give them a resounding welcome!`;
      }
      if (q.includes('delay')) {
        return `Ladies and gentlemen, a brief schedule update: we have extended our current session by ${delay} minutes to allow for an in-depth Q&A. We appreciate your patience!`;
      }
      if (q.includes('transition')) {
        return `Thank you everyone for engaging with "${current}". We are now transitioning to our next session: "${next}". Please take your seats!`;
      }
      if (q.includes('closing')) {
        return `Thank you all for being part of ${event}! Safe travels and congratulations to everyone!`;
      }
      if (q.includes('filler')) {
        return `While our stage production team completes preparation for "${current}", take a quick stretch and stay tuned!`;
      }
      if (q.includes('emergency')) {
        return `Attention please: remain in your seats while our stage crew addresses an immediate announcement.`;
      }
      return `Here is the live update: Current session is "${current}" and next session is "${next}". Event health is ${context.eventHealth}.`;
    }
    default:
      return `StagePilot generated response for ${event}.`;
  }
}

/**
 * Generate AI script or assistant reply.
 * @param {string} type - 'opening' | 'introduction' | 'transition' | 'closing' | 'announcement' | 'assistant'
 * @param {object} context - Rich context from contextBuilder
 * @returns {Promise<{ success: boolean, script?: string, response?: string, message?: string, context?: object }>}
 */
async function generateScript(type, context) {
  logger.ai(`Generating script: type="${type}", event="${context.eventName || ''}"`);

  const prompt = buildPrompt(type, context);

  // If no API keys configured or explicitly using offline/mock mode in tests
  if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) {
    logger.ai(`No external AI API key provided. Using contextual StagePilot engine.`);
    const fallback = generateContextualFallback(type, context);
    return {
      success: true,
      script: fallback,
      response: fallback,
      provider: 'stagepilot-contextual-engine',
      context,
    };
  }

  try {
    // 1. Try Gemini if configured
    if (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
      try {
        const genAI = getGeminiClient();
        const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-1.5-flash'];
        let text = null;
        for (const mName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent(prompt);
            text = result.response.text().trim();
            if (text) break;
          } catch (mErr) {
            logger.warn && logger.warn('[AI]', `Model ${mName} failed: ${mErr.message}`);
          }
        }
        if (!text) {
          throw new Error('All Gemini candidate models failed to generate content');
        }
        logger.ai(`Gemini generated response for type="${type}"`);
        return {
          success: true,
          script: text,
          response: text,
          provider: 'gemini',
          context,
        };
      } catch (geminiError) {
        logger.error('[AI]', `Gemini API invocation failed: ${geminiError.message}`);
        // If OpenAI key is also available, attempt fallback to OpenAI
        if (env.OPENAI_API_KEY) {
          logger.ai(`Attempting fallback to OpenAI...`);
          const openai = getOpenAIClient();
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: context.maxLength ? Math.min(context.maxLength * 2, 500) : 300,
          });
          const text = completion.choices[0].message.content.trim();
          logger.ai(`OpenAI generated response for type="${type}"`);
          return {
            success: true,
            script: text,
            response: text,
            provider: 'openai',
            context,
          };
        }
        // If both failed or only gemini was available, return standard failure per Requirement 9
        return {
          success: false,
          message: 'AI service temporarily unavailable',
        };
      }
    }

    // 2. Try OpenAI if configured
    if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: context.maxLength ? Math.min(context.maxLength * 2, 500) : 300,
        });
        const text = completion.choices[0].message.content.trim();
        logger.ai(`OpenAI generated response for type="${type}"`);
        return {
          success: true,
          script: text,
          response: text,
          provider: 'openai',
          context,
        };
      } catch (openaiError) {
        logger.error('[AI]', `OpenAI API invocation failed: ${openaiError.message}`);
        return {
          success: false,
          message: 'AI service temporarily unavailable',
        };
      }
    }

    // Fallback if neither condition matched
    const fallback = generateContextualFallback(type, context);
    return {
      success: true,
      script: fallback,
      response: fallback,
      provider: 'stagepilot-contextual-engine',
      context,
    };
  } catch (error) {
    logger.error('[AI]', `Unhandled error in generateScript: ${error.message}`);
    // Requirement 9:
    // If the AI API fails, return: { "success": false, "message": "AI service temporarily unavailable" }
    // Never crash the backend because the AI API failed.
    return {
      success: false,
      message: 'AI service temporarily unavailable',
    };
  }
}

module.exports = {
  generateScript,
  generateContextualFallback,
  analyzeSpeechTracking,
};

