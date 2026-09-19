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
    case 'filler':
      return buildFillerPrompt(context);
    case 'emergency':
      return buildEmergencyPrompt(context);
    case 'teleprompter_assist':
      return buildTeleprompterAssistPrompt(context);
    case 'assistant':
      return buildAssistantPrompt(context);
    default:
      throw new Error(`Unknown prompt type: ${type}`);
  }
}

function buildFillerPrompt(context) {
  const current = context.currentSession ? `"${context.currentSession.title}"` : 'the next session';
  return `You are a live stage anchor delivering a short filler speech while technical crew calibrates for ${current}.
Event: ${context.eventName} (Venue: ${context.venue})
Theme: ${context.theme || 'Innovation'}
Tone: ${context.tone || 'professional'}

Write a 25-35 word smooth spoken filler script to keep the audience entertained and informed. Output ONLY spoken words.`;
}

function buildEmergencyPrompt(context) {
  return `You are a live stage anchor making an urgent stage broadcast to the room.
Event: ${context.eventName}
Directive: "${context.rawMessage || context.message || 'Please remain seated and await instructions.'}"
Tone: authoritative and calm.

Write a 25-45 word calm, authoritative stage announcement. Output ONLY spoken words.`;
}

function buildTeleprompterAssistPrompt(context) {
  const speech = context.speechContext || {};
  return `You are StagePilot Live Teleprompter & Speech AI Co-Pilot.
Target Teleprompter Script: "${speech.currentScript || ''}"
Spoken Words Captured: "${speech.recognizedText || ''}"
Elapsed Spoken Time: ${speech.elapsedSeconds || 0} seconds

Analyze the spoken words against the script and pace.
Provide immediate tactical advice to the stage anchor: pace feedback, missed-script detection, and the exact next line to read.`;
}

function buildAssistantPrompt(context) {
  const query = context.userQuery || context.command || 'What is next?';
  const current = context.currentSession ? `"${context.currentSession.title}" (${context.currentSession.status || 'LIVE'})` : 'None currently active';
  const next = context.nextSession ? `"${context.nextSession.title}" (Speaker: ${context.nextSession.speakerName || 'TBA'})` : 'No further sessions scheduled';
  const speaker = context.currentSpeaker
    ? `${context.currentSpeaker.name}${context.currentSpeaker.pronunciationGuide ? ` [Pronounced: ${context.currentSpeaker.pronunciationGuide}]` : ''}, ${context.currentSpeaker.designation || ''} (${context.currentSpeaker.organization || ''})`
    : 'Not specified';
  const speechTracking = context.speechContext
    ? `\n- Speech Tracking: Spoken="${context.speechContext.recognizedText || 'N/A'}", Target="${context.speechContext.currentScript || 'N/A'}", Elapsed=${context.speechContext.elapsedSeconds || 0}s`
    : '';

  return `You are StagePilot AI Assistant, the intelligent real-time co-pilot for live event anchors.
You are assisting an anchor standing on stage during a live event.

Current Live Event Snapshot:
- Event: ${context.eventName} (Venue: ${context.venue})
- Audience: ${context.audience}
- Event Health: ${context.eventHealth} (Total Delay: ${context.delayTotalMinutes} mins)
- Current Session: ${current}
- Current Speaker: ${speaker}
- Next Session: ${next}
- Schedule Delay/Changes: ${JSON.stringify(context.scheduleChanges || [])}${speechTracking}
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
8. If the user asks for pace or speech tracking assistance, evaluate spoken progress against script.
9. Deliver an immediate, anchor-ready, professional spoken response without meta-chat preamble.`;
}

module.exports = { buildPrompt };

