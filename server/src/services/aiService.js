import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from '../config/env.js';
import { getOpenAIClient } from '../config/ai.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScriptLog } from '../models/ScriptLog.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load pre-cached fallback scripts
const fallbackPath = path.join(__dirname, '../prompts/fallbackScripts.json');
let fallbackData = {};
try {
  fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
} catch (e) {
  logger.warn('Could not read fallbackScripts.json');
}

/**
 * Replace placeholders like {speakerName}, {eventTitle} in fallback text
 */
const interpolate = (template = '', data = {}) => {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] || '');
};

export const generateAIScript = async ({
  eventId,
  sessionId = null,
  scriptType,
  prompt,
  contextData = {},
  tone = 'professional'
}) => {
  let generatedScript = '';
  let provider = 'fallback';

  // 1. Try Google Gemini API if key is present
  if (ENV.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 6000))
      ]);

      const response = await result.response;
      const text = response.text();
      if (text) {
        generatedScript = text.trim();
        provider = 'gemini';
      }
    } catch (err) {
      logger.warn(`Gemini generation failed or timed out: ${err.message}. Using fallback.`);
    }
  }

  // 2. Try OpenAI API if Gemini not used and OpenAI key present
  if (!generatedScript && ENV.OPENAI_API_KEY) {
    try {
      const openai = getOpenAIClient();
      if (openai) {
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 250,
            temperature: 0.7
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 6000))
        ]);

        generatedScript = completion.choices[0]?.message?.content?.trim();
        provider = 'openai';
      }
    } catch (err) {
      logger.warn(`OpenAI generation failed: ${err.message}. Using fallback.`);
    }
  }

  // 3. Fallback Generation (instant, contextual, resilient)
  if (!generatedScript) {
    const scriptsForType = fallbackData[scriptType] || fallbackData['opening'];
    const template = scriptsForType[tone] || scriptsForType['professional'] || Object.values(scriptsForType)[0];
    
    generatedScript = interpolate(template, {
      eventTitle: contextData.eventTitle || 'Tech Horizon Summit',
      venue: contextData.venue || 'Grand Stage',
      theme: contextData.theme || 'AI & Cloud Infrastructure',
      speakerName: contextData.speakerName || 'Dr. Elena Rostova',
      speakerTitle: contextData.speakerTitle || 'Chief Scientist',
      speakerCompany: contextData.speakerCompany || 'DeepTech Labs',
      sessionTitle: contextData.sessionTitle || 'Autonomous AI Agents',
      nextSessionTitle: contextData.nextSessionTitle || 'The Quantum Computing Era',
      nextSpeakerName: contextData.nextSpeakerName || 'Marcus Vance',
      nextSpeakerCompany: contextData.nextSpeakerCompany || 'NextGen Systems',
      delayMinutes: contextData.delayMinutes || '10',
      newTime: contextData.newTime || '11:15 AM'
    });
    provider = 'smart-fallback';
  }

  // Save log in background
  try {
    await ScriptLog.create({
      eventId,
      sessionId,
      scriptType,
      prompt,
      generatedScript,
      tone,
      provider
    });
  } catch (logErr) {
    // Non-blocking log
  }

  return {
    script: generatedScript,
    scriptType,
    provider,
    tone
  };
};
