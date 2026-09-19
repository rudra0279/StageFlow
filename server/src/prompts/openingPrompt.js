import { buildEventContext } from './promptBuilder.js';

export const buildOpeningPrompt = (event, tone = 'professional') => {
  const context = buildEventContext(event);
  return `
You are a master live event host and master of ceremonies (MC/Anchor).
Tone: ${tone} (Options: professional, energetic, humorous).

${context}

TASK:
Write a spoken opening welcome script for the anchor to kick off the event from the main stage.

GUIDELINES:
- Output ONLY the spoken words (no stage directions, no [applause], no formatting markers).
- Write in short, punchy, breathable sentences suitable for a live teleprompter.
- Emphasize the theme, welcome the audience, and build anticipation for the day ahead.
- Keep duration between 45 and 75 spoken seconds (approx 90-140 words).
`.trim();
};
