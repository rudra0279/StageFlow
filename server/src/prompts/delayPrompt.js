import { buildEventContext } from './promptBuilder.js';

export const buildDelayPrompt = (
  event,
  session,
  delayMinutes = 10,
  reason = 'technical adjustments',
  tone = 'professional'
) => {
  const context = buildEventContext(event, session);
  return `
You are a live event anchor handling an unplanned stage delay.
Delay Duration: ${delayMinutes} minutes
Reason for Delay: ${reason}
Tone: ${tone} (Options: professional, humorous, energetic).

${context}

TASK:
Write a stage filler announcement script for the anchor to speak to the audience right now.

GUIDELINES:
- Output ONLY the spoken words.
- Be completely transparent yet reassuring and in control.
- Never sound stressed, defensive, or chaotic.
- Frame the ${delayMinutes}-minute delay gracefully, give the audience a short action (e.g. chat with their neighbor, stretch, or think of a question for the upcoming session), and reassure them when the session will resume.
- Keep to 40-60 spoken words.
`.trim();
};
