// src/services/ai/prompts/transition.js
module.exports = function buildTransitionPrompt(context) {
  const current = context.currentSession || {};
  const currentSpeaker = context.currentSpeaker || {};
  const next = context.nextSession || {};
  const nextSpeaker = next.speakerId || {};

  return `You are StagePilot, an expert live event anchor and MC co-pilot.
Generate a smooth, natural transition script bridging the conclusion of the current session and the kickoff of the next session.

Context:
- Event: ${context.eventName || 'Live Event'}
- Just Concluded Session: ${current.title || 'Previous Session'}
- Concluded Speaker: ${currentSpeaker.name || current.speakerName || 'Our Previous Speaker'}
- Next Session: ${next.title || 'Next Session'}
- Next Speaker / Host: ${nextSpeaker.name || next.speakerName || 'Our Next Guest'}
- Next Session Room/Stage: ${next.room || 'Main Stage'}
- Audience: ${context.audience || 'College attendees'}
- Tone: ${context.tone || 'engaging and seamless'}
- Max Length: ${context.maxLength || 80} words

Requirements:
1. Briefly express gratitude for the completed session's key takeaways.
2. Build immediate excitement for the incoming session and introduce what attendees will gain.
3. Provide practical guidance if there is room movement or a quick 2-minute reset.
4. Return only the anchor script.`;
};
