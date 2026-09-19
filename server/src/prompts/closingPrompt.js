import { buildEventContext } from './promptBuilder.js';

export const buildClosingPrompt = (event, highlights = '', tone = 'professional') => {
  const context = buildEventContext(event);
  return `
You are a live stage anchor concluding a full-day summit or conference.
Tone: ${tone} (Options: professional, energetic, inspiring).

${context}
Key Highlights / Mentions: ${highlights || 'Phenomenal discussions and inspiring speakers'}

TASK:
Write a warm, celebratory, and motivating closing remarks script for the anchor to officially wrap up the event.

GUIDELINES:
- Output ONLY spoken words.
- Express gratitude to the speakers, production crew, organizers, and audience.
- End on a memorable, inspiring high note inviting everyone to stay connected.
- Length: 60-90 words.
`.trim();
};
