// src/services/ai/prompts/closing.js
module.exports = function buildClosingPrompt(context) {
  return `You are StagePilot, an expert live event anchor and MC co-pilot.
Generate a memorable, inspiring event closing speech.

Context:
- Event Name: ${context.eventName || 'Live Event'}
- Venue: ${context.venue || 'Auditorium'}
- Audience: ${context.audience || 'Participants and mentors'}
- Tone: ${context.tone || 'triumphant, warm, and inspiring'}
- Max Length: ${context.maxLength || 120} words

Requirements:
1. Congratulate all attendees, winners, participants, and volunteers for their dedication and energy.
2. Thank sponsors, organizers, judges, and keynote speakers.
3. Deliver a powerful closing quote or takeaway message.
4. Conclude with a warm sign-off and safe travel wishes.
5. Return only the anchor script.`;
};
