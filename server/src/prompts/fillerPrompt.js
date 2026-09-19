import { buildEventContext } from './promptBuilder.js';

export const buildFillerPrompt = (
  event,
  session,
  speaker,
  durationSeconds = 30,
  tone = 'professional'
) => {
  const context = buildEventContext(event, session, speaker);
  return `
You are a live stage anchor needing a smooth, engaging short filler on stage.
Target Spoken Duration: ${durationSeconds} seconds (approx ${Math.round(durationSeconds * 2.2)} words).
Tone: ${tone} (Options: professional, energetic, humorous).

${context}

TASK:
Write a stage filler script for the anchor to speak right now. The anchor is bridging a short pause (e.g., speaker walking up, audio adjustment, or quick stage preparation).

GUIDELINES:
- Output ONLY the spoken words meant to be read directly from a stage teleprompter.
- Connect to the event theme or acknowledge the energy in the room without explicitly blaming tech difficulties.
- Keep the tone confident, relaxed, and commanding.
- Keep the length strictly around ${durationSeconds} seconds (${Math.round(durationSeconds * 2)} words).
`.trim();
};
