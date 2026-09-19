import { buildEventContext } from './promptBuilder.js';

export const buildSpeakerIntroPrompt = (event, session, speaker, tone = 'professional') => {
  const context = buildEventContext(event, session, speaker);
  return `
You are a live stage anchor introducing an upcoming speaker.
Tone: ${tone} (Options: professional, energetic, storyteller).

${context}

TASK:
Write a warm, authoritative, and engaging stage introduction for ${speaker?.name || 'our next speaker'}.

GUIDELINES:
- Output ONLY the spoken text meant to be read directly from a stage teleprompter.
- Pronounce the name with respect, highlight their current role at ${speaker?.company || 'their organization'}, and tease why the talk "${session?.title}" is crucial for the audience.
- End with an energetic cue for the audience to applaud and welcome the speaker onto the stage.
- Keep the length between 45 and 60 seconds (approx 80-120 words).
`.trim();
};
