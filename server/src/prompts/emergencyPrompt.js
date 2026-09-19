import { buildEventContext } from './promptBuilder.js';

export const buildEmergencyPrompt = (
  event,
  session,
  message = '',
  urgency = 'CRITICAL',
  tone = 'authoritative'
) => {
  const context = buildEventContext(event, session);
  return `
You are a live stage anchor delivering an emergency or urgent stage announcement to the audience.
Urgency Level: ${urgency}
Announcement Directive: "${message || 'Please remain seated and await instructions from stage control.'}"
Tone: ${tone} (Options: authoritative, calm, urgent).

${context}

TASK:
Write a calm, authoritative, and direct spoken announcement for the anchor to read directly from the teleprompter immediately.

GUIDELINES:
- Output ONLY the spoken words.
- Project calm authority and total control; do not cause panic.
- Give clear, unambiguous instructions to the audience.
- Keep the script concise: 30-50 spoken words.
`.trim();
};
