// src/services/ai/prompts/opening.js
module.exports = function buildOpeningPrompt(context) {
  return `You are StagePilot, an expert live event anchor and MC co-pilot.
Generate a high-energy, engaging opening speech for the live event based on the context below.

Context:
- Event Name: ${context.eventName || 'Live Event'}
- Venue: ${context.venue || 'Main Auditorium'}
- Target Audience: ${context.audience || 'College students and guests'}
- Tone: ${context.tone || 'energetic and professional'}
- Max Length: ${context.maxLength || 150} words
${context.currentSession ? `- First / Current Session: ${context.currentSession.title}` : ''}
${context.currentSpeaker ? `- First Speaker / Guest: ${context.currentSpeaker.name} (${context.currentSpeaker.designation || ''})` : ''}

Requirements:
1. Welcome the audience warmly and set an exciting, motivating tone.
2. Mention the event name, venue, and key theme.
3. Keep it crisp, anchor-ready, ready to be read aloud (include brief stage directions in brackets like [Smile, pause] if helpful).
4. Strictly keep the speech within ${context.maxLength || 150} words.
5. Return only the script speech without conversational filler or introductory disclaimers.`;
};
