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
 * Deterministic fallback generator based on rich context when API keys are absent or in sandbox mode.
 */
function generateContextualFallback(type, context) {
  const event = context.eventName || 'the event';
  const current = context.currentSession ? context.currentSession.title : 'the current session';
  const speaker = context.currentSpeaker ? `${context.currentSpeaker.name}` : 'our esteemed speaker';
  const next = context.nextSession ? context.nextSession.title : 'our next session';
  const nextSpeaker = context.nextSession && context.nextSession.speakerName ? `with ${context.nextSession.speakerName}` : '';
  const delay = context.delayMinutes || context.delayTotalMinutes || 10;

  switch (type) {
    case 'opening':
      return `Good morning, ladies and gentlemen, innovators and guests! Welcome to ${event} here at ${context.venue || 'the venue'}. Today is all about creativity, collaboration, and pushing boundaries. Get ready for an electrifying journey!`;
    case 'introduction':
      return `It is an absolute honor to introduce our distinguished guest, ${speaker}${context.currentSpeaker && context.currentSpeaker.designation ? `, ${context.currentSpeaker.designation}` : ''}. Today, they will share profound insights on "${current}". Please join me in giving a warm round of applause to welcome ${speaker} to the stage!`;
    case 'transition':
      return `A tremendous thank you to ${speaker} for that inspiring session on "${current}". As we transition, prepare yourselves for "${next}" ${nextSpeaker}. Take a breath, reset, and let's keep the momentum going!`;
    case 'announcement':
      if (context.delayMinutes || context.scheduleChanges && context.scheduleChanges.length > 0) {
        return `Attention please! We have a quick update: session "${current}" is extended by approximately ${delay} minutes. Please enjoy this brief pause to grab a beverage and network. We will resume promptly!`;
      }
      return `Attention all attendees: ${context.rawMessage || context.message || 'Please take note of the schedule updates on your dashboard.'}`;
    case 'closing':
      return `What an unbelievable journey ${event} has been! On behalf of the entire organizing committee, thank you to all participants, judges, sponsors, and mentors. Keep innovating and building. Until next time, travel safe and goodbye!`;
    case 'assistant': {
      const q = (context.userQuery || '').toLowerCase();
      if (q.includes('next')) {
        return `Next up is "${next}" ${nextSpeaker} in room ${context.nextSession ? context.nextSession.room || 'Main Stage' : 'Main Stage'}. Event status is currently ${context.eventHealth}.`;
      }
      if (q.includes('speaker') || q.includes('introduce')) {
        return `Coming up next: ${nextSpeaker || speaker}. An accomplished leader ready to enlighten us on "${next}". Let's give them a resounding welcome!`;
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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
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
};
