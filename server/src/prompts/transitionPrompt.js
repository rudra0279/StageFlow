import { buildEventContext } from './promptBuilder.js';

export const buildTransitionPrompt = (
  event,
  currentSession,
  currentSpeaker,
  nextSession,
  nextSpeaker,
  tone = 'professional'
) => {
  const context = buildEventContext(event, currentSession, currentSpeaker);
  return `
You are a live stage anchor bridging two sessions on stage.
Tone: ${tone} (Options: professional, energetic, insightful).

${context}
NEXT UP:
- Next Session: "${nextSession?.title || 'Upcoming Talk'}"
- Next Speaker: ${nextSpeaker?.name || 'Upcoming Speaker'} (${nextSpeaker?.title || ''}, ${nextSpeaker?.company || ''})

TASK:
Write a smooth, elegant 30-second stage transition script that:
1. Briefly thanks the speaker who just completed their talk ("${currentSession?.title}").
2. Creates an intellectual or thematic bridge to the next talk ("${nextSession?.title}").
3. Seamlessly welcomes ${nextSpeaker?.name || 'our next speaker'} to the stage.

Output ONLY spoken words for the teleprompter (under 75 words).
`.trim();
};
