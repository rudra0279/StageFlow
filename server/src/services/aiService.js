import mongoose from 'mongoose';
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

/**
 * Analyze speech recognition tracking against script and calculate pace/progress
 */
export const analyzeSpeechTracking = (speechTracking = {}) => {
  const recognizedText = (speechTracking.recognizedText || '').trim();
  const currentScript = (speechTracking.currentScript || '').trim();
  const elapsedSeconds = Math.max(Number(speechTracking.elapsedSeconds) || 0, 0);

  const words = recognizedText.length > 0 ? recognizedText.split(/\s+/).filter(Boolean) : [];
  const wordsSpoken = words.length;

  // Words per minute (target 130-150 WPM on live stage)
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

  // Detect script sentences and identify missed / upcoming segments
  const scriptSentences = currentScript
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let nextLine = '';
  let missedPhrases = [];
  let recoveryLine = '';

  if (scriptSentences.length > 0) {
    const recognizedLower = recognizedText.toLowerCase();

    // Find the furthest matched sentence
    let lastMatchedIndex = -1;
    for (let i = 0; i < scriptSentences.length; i++) {
      const sentence = scriptSentences[i];
      // Check significant words
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

    // Check for missed sentences prior to the furthest matched point
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
    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    try {
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 10000))
          ]);

          const response = await result.response;
          const text = response.text();
          if (text) {
            generatedScript = text.trim();
            provider = 'gemini';
            break;
          }
        } catch (mErr) {
          logger.warn(`Gemini [${modelName}] failed: ${mErr.message}`);
        }
      }
    } catch (err) {
      logger.warn(`Gemini generation failed: ${err.message}. Using fallback.`);
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
    const template =
      scriptsForType[tone] ||
      scriptsForType['professional'] ||
      scriptsForType['default'] ||
      Object.values(scriptsForType)[0];

    generatedScript = interpolate(template, {
      eventTitle: contextData.eventTitle || 'Tech Horizon Summit',
      venue: contextData.venue || 'Grand Stage',
      theme: contextData.theme || 'AI & Cloud Infrastructure',
      speakerName: contextData.speakerName || 'Dr. Elena Rostova',
      speakerTitle: contextData.speakerTitle || 'Chief Scientist',
      speakerCompany: contextData.speakerCompany || 'DeepTech Labs',
      speakerPronunciation: contextData.speakerPronunciation || 'Standard pronunciation',
      sessionTitle: contextData.sessionTitle || 'Autonomous AI Agents',
      nextSessionTitle: contextData.nextSessionTitle || 'The Quantum Computing Era',
      nextSpeakerName: contextData.nextSpeakerName || 'Marcus Vance',
      nextSpeakerCompany: contextData.nextSpeakerCompany || 'NextGen Systems',
      nextSpeakerPronunciation: contextData.nextSpeakerPronunciation || 'Standard pronunciation',
      delayMinutes: contextData.delayMinutes || '10',
      newTime: contextData.newTime || '11:15 AM',
      emergencyMessage: contextData.emergencyMessage || contextData.message || 'Please remain seated for a stage update.',
      wordsPerMinute: contextData.wordsPerMinute || '140',
      missedPhrase: contextData.missedPhrase || 'key highlight',
      recoveryLine: contextData.recoveryLine || 'Moving smoothly forward with our program...',
      nextLine: contextData.nextLine || 'Welcome to the stage our next distinguished speaker.',
      paceSuggestion: contextData.paceSuggestion || 'Pace is steady and on target.'
    });
    provider = 'smart-fallback';
  }

  // Save log in background if DB is connected
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await ScriptLog.create({
        eventId,
        sessionId,
        scriptType,
        prompt,
        generatedScript,
        tone,
        provider
      });
    }
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

