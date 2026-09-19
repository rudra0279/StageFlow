// src/services/ai/promptBuilder.js
const buildOpeningPrompt = require('./prompts/opening');
const buildIntroductionPrompt = require('./prompts/introduction');
const buildTransitionPrompt = require('./prompts/transition');
const buildClosingPrompt = require('./prompts/closing');
const buildAnnouncementPrompt = require('./prompts/announcement');

function buildPrompt(type, context) {
  switch (type) {
    case 'opening':
      return buildOpeningPrompt(context);
    case 'introduction':
      return buildIntroductionPrompt(context);
    case 'transition':
      return buildTransitionPrompt(context);
    case 'closing':
      return buildClosingPrompt(context);
    case 'announcement':
      return buildAnnouncementPrompt(context);
    case 'assistant':
      return buildAssistantPrompt(context);
    default:
      throw new Error(`Unknown prompt type: ${type}`);
  }
}

function buildAssistantPrompt(context) {
  const query = context.userQuery || context.command || 'What is next?';
  const current = context.currentSession ? `"${context.currentSession.title}" (${context.currentSession.status || 'LIVE'})` : 'None currently active';
  const next = context.nextSession ? `"${context.nextSession.title}" (Speaker: ${context.nextSession.speakerName || 'TBA'})` : 'No further sessions scheduled';
  const speaker = context.currentSpeaker ? `${context.currentSpeaker.name}, ${context.currentSpeaker.designation || ''} (${context.currentSpeaker.organization || ''})` : 'Not specified';

  return `You are StagePilot AI Assistant, the intelligent real-time co-pilot for live event anchors.
You are assisting an anchor standing on stage during a live event.

Current Live Event Snapshot:
- Event: ${context.eventName} (Venue: ${context.venue})
- Audience: ${context.audience}
- Event Health: ${context.eventHealth} (Total Delay: ${context.delayTotalMinutes} mins)
- Current Session: ${current}
- Current Speaker: ${speaker}
- Next Session: ${next}
- Schedule Delay/Changes: ${JSON.stringify(context.scheduleChanges || [])}
- Requested Tone: ${context.tone || 'clear and supportive'}

Anchor Request:
"${query}"

Instructions:
1. Ground your answer strictly in the current live event snapshot above.
2. If the user asks "What is next?", summarize the upcoming session title, speaker, and any delay status cleanly.
3. If the user asks "Introduce the next speaker", provide a ready-to-read speaker intro for the next session.
4. If the user asks "Generate a transition", create a bridge from the current session to the next session.
5. If the user asks "Generate a delay announcement", craft a spoken delay announcement reflecting the current delay.
6. If the user asks "Give me a short announcement", craft a short punchy stage announcement.
7. If the user asks "Give me the closing speech", generate the closing speech for the event.
8. Deliver an immediate, anchor-ready, professional spoken response without meta-chat preamble.`;
}

module.exports = { buildPrompt };
