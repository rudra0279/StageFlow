/**
 * Assembles rich contextual information from event, current/next session, speakers, and live speech tracking
 */
export const buildEventContext = (
  event = {},
  session = null,
  speaker = null,
  nextSession = null,
  nextSpeaker = null,
  speechTracking = null
) => {
  const eventTitle = event.title || event.name || 'Live Stage Event';
  const eventTheme = event.theme || 'Technology & Innovation';
  const eventVenue = event.venue || 'Main Stage';
  const healthStatus = event.healthStatus || event.eventHealth || 'ON_SCHEDULE';
  const totalDelay = event.totalDelayMinutes ?? event.delayTotalMinutes ?? 0;

  let context = `EVENT CONTEXT:
- Title: "${eventTitle}"
- Theme: "${eventTheme}"
- Venue: "${eventVenue}"
- Schedule Health: ${healthStatus} (Total Delay: ${totalDelay} mins)`;

  if (session) {
    context += `\n\nCURRENT SESSION:
- Title: "${session.title}"
- Duration: ${session.durationMinutes || 30} mins
- Status: ${session.status || 'LIVE'}
- Stage Notes: ${session.stageNotes || session.description || 'None'}`;
  }

  if (speaker) {
    const speakerPronunciation = speaker.pronunciationGuide
      ? `[${speaker.pronunciationGuide}] (Crucial: Pronounce as indicated)`
      : 'Standard pronunciation';

    context += `\n\nCURRENT SPEAKER:
- Name: ${speaker.name}
- Title / Role: ${speaker.title || speaker.designation || 'Speaker'} at ${speaker.company || speaker.organization || 'Industry Leader'}
- Phonetic Pronunciation Guide: ${speakerPronunciation}
- Bio: ${speaker.bio || 'Accomplished expert'}
- Key Highlights: ${Array.isArray(speaker.keyAchievements) ? speaker.keyAchievements.join(', ') : (speaker.keyAchievements || 'Industry leader')}`;
  }

  if (nextSession) {
    context += `\n\nNEXT UPCOMING SESSION:
- Next Session: "${nextSession.title}"
- Duration: ${nextSession.durationMinutes || 30} mins
- Status: ${nextSession.status || 'UPCOMING'}`;

    if (nextSpeaker) {
      const nextPronunciation = nextSpeaker.pronunciationGuide
        ? `[${nextSpeaker.pronunciationGuide}]`
        : 'Standard pronunciation';

      context += `\n- Next Speaker: ${nextSpeaker.name} (${nextSpeaker.title || nextSpeaker.designation || ''}, ${nextSpeaker.company || nextSpeaker.organization || ''})
- Next Speaker Pronunciation: ${nextPronunciation}`;
    }
  }

  if (speechTracking) {
    context += `\n\nLIVE SPEECH & TELEPROMPTER TRACKING:
- Current Target Script: "${speechTracking.currentScript || 'N/A'}"
- Live Spoken / Recognized Text: "${speechTracking.recognizedText || 'N/A'}"
- Elapsed Spoken Time: ${speechTracking.elapsedSeconds || 0} seconds
- Active Speaker: "${speechTracking.speaker || speaker?.name || 'Stage Anchor'}"
${speechTracking.wordsPerMinute ? `- Measured Pace: ${speechTracking.wordsPerMinute} WPM (${speechTracking.paceStatus || 'normal'})` : ''}`;
  }

  return context.trim();
};

