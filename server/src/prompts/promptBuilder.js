/**
 * Assembles contextual information from event, session, and speaker data
 */
export const buildEventContext = (event = {}, session = null, speaker = null) => {
  return `
EVENT CONTEXT:
- Title: "${event.title || 'Live Stage Event'}"
- Theme: "${event.theme || 'Technology & Innovation'}"
- Venue: "${event.venue || 'Main Stage'}"
- Schedule Health: ${event.healthStatus || 'ON_SCHEDULE'} (Total Delay: ${event.totalDelayMinutes || 0} mins)
${
  session
    ? `- Current Session: "${session.title}" (Duration: ${session.durationMinutes} mins)
- Notes: ${session.stageNotes || 'None'}`
    : ''
}
${
  speaker
    ? `- Speaker: ${speaker.name}
- Title/Role: ${speaker.title} at ${speaker.company || 'Industry Leader'}
- Pronunciation: ${speaker.pronunciationGuide || 'Standard pronunciation'}
- Bio: ${speaker.bio || 'Accomplished expert'}
- Key Highlights: ${speaker.keyAchievements?.join(', ') || 'Industry pioneer'}`
    : ''
}
`.trim();
};
