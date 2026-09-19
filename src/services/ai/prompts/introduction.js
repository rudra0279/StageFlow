// src/services/ai/prompts/introduction.js
module.exports = function buildIntroductionPrompt(context) {
  const speaker = context.currentSpeaker || {};
  const session = context.currentSession || {};

  return `You are StagePilot, an expert live event anchor and MC co-pilot.
Generate a captivating 30–45 second introduction speech for the speaker based on the context below.

Context:
- Event Name: ${context.eventName || 'Live Event'}
- Speaker Name: ${speaker.name || 'Honorable Speaker'}
- Designation: ${speaker.designation || 'Distinguished Guest'}
- Organization: ${speaker.organization || ''}
- Session Topic: ${speaker.topic || session.title || 'Special Session'}
- Bio: ${speaker.bio || 'Accomplished expert with profound contributions.'}
- Audience: ${context.audience || 'College students and attendees'}
- Tone: ${context.tone || 'inspirational and respectful'}
- Max Length: ${context.maxLength || 100} words (aim for 60-90 words, 30-45 seconds speaking time)

Requirements:
1. Introduce the speaker with prestige, highlighting their achievements and topic relevance.
2. Build anticipation for their talk.
3. Conclude with a strong stage handover (e.g., "Please put your hands together for...").
4. Return only the anchor script without any extra conversational commentary.`;
};
