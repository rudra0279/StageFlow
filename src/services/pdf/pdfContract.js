// src/services/pdf/pdfContract.js

const { cleanPdfText } = require('./pdfUtils.js');

/**
 * Validates and normalizes raw Run-of-Show export data into an authoritative,
 * clean internal contract decoupled from any database models.
 *
 * @param {Object} rawInput
 * @returns {NormalizedRunOfShow}
 */
function normalizeRunOfShowData(rawInput = {}) {
  const data = rawInput || {};

  // 1. Normalize Event Metadata
  const rawEvent = data.event || {};
  const event = {
    title: cleanPdfText(rawEvent.title || rawEvent.name || 'StagePilot Run-of-Show Event'),
    date: rawEvent.date || new Date().toISOString(),
    venue: cleanPdfText(rawEvent.venue || rawEvent.location || 'Venue TBA'),
    healthStatus: cleanPdfText(rawEvent.healthStatus || rawEvent.eventHealth || rawEvent.health || 'ON_TRACK'),
    totalDelayMinutes: Number(rawEvent.totalDelayMinutes ?? rawEvent.delayTotalMinutes ?? rawEvent.delay ?? 0),
    status: cleanPdfText(rawEvent.status || data.status || 'UPCOMING').toUpperCase(),
    description: cleanPdfText(rawEvent.description || '')
  };

  // 2. Normalize Speakers Map
  const speakerMap = new Map();
  const rawSpeakers = Array.isArray(data.speakers) ? data.speakers : [];
  rawSpeakers.forEach((spk) => {
    if (!spk) return;
    const id = spk.id || spk._id;
    const normalizedSpk = {
      id: id ? String(id) : undefined,
      name: cleanPdfText(spk.name || 'Speaker TBA'),
      title: cleanPdfText(spk.title || spk.designation || ''),
      company: cleanPdfText(spk.company || spk.organization || '')
    };
    if (id) {
      speakerMap.set(String(id), normalizedSpk);
    }
    if (spk.name) {
      speakerMap.set(cleanPdfText(spk.name).toLowerCase(), normalizedSpk);
    }
  });

  // 3. Normalize Sessions
  const rawSessions = Array.isArray(data.sessions) ? data.sessions : [];
  const normalizedSessions = rawSessions.map((sess, idx) => {
    if (!sess) return null;

    const id = sess.id || sess._id || `sess_${idx + 1}`;
    const title = cleanPdfText(sess.title || sess.name || `Session ${idx + 1}`);

    // Track identification
    const track = cleanPdfText(sess.track || sess.trackId || sess.room || 'Track A');

    // Speaker resolution
    let speakerName = '';
    let speakerRole = '';
    let speakerCompany = '';

    if (sess.speaker && typeof sess.speaker === 'object') {
      speakerName = cleanPdfText(sess.speaker.name || '');
      speakerRole = cleanPdfText(sess.speaker.title || sess.speaker.designation || '');
      speakerCompany = cleanPdfText(sess.speaker.company || sess.speaker.organization || '');
    } else if (typeof sess.speaker === 'string' && sess.speaker.trim()) {
      speakerName = cleanPdfText(sess.speaker);
    }

    // Try speakerId lookup if speaker data was partial
    const spkId = sess.speakerId ? String(sess.speakerId) : null;
    if (spkId && speakerMap.has(spkId)) {
      const match = speakerMap.get(spkId);
      if (!speakerName) speakerName = match.name;
      if (!speakerRole) speakerRole = match.title;
      if (!speakerCompany) speakerCompany = match.company;
    } else if (speakerName && speakerMap.has(speakerName.toLowerCase())) {
      const match = speakerMap.get(speakerName.toLowerCase());
      if (!speakerRole) speakerRole = match.title;
      if (!speakerCompany) speakerCompany = match.company;
    }

    // Affiliation line: "Title, Company" or whichever exists
    const affiliationParts = [speakerRole, speakerCompany].filter(Boolean);
    const speakerAffiliation = affiliationParts.join(' | ');

    // Times: Authoritative original scheduled times
    const scheduledStartTime = sess.scheduledStartTime || sess.startTime || null;
    const scheduledEndTime = sess.scheduledEndTime || sess.endTime || null;

    // Times: Authoritative current/adjusted times
    const currentStartTime = sess.currentStartTime || sess.calculatedStartTime || sess.adjustedStartTime || scheduledStartTime;
    const currentEndTime = sess.currentEndTime || sess.calculatedEndTime || sess.adjustedEndTime || scheduledEndTime;

    // Delay: Authoritative delay supplied by export
    const delayMinutes = Number(sess.delayMinutes ?? sess.delayOffsetMinutes ?? sess.delay ?? 0);

    // Duration: minutes
    let durationMinutes = Number(sess.durationMinutes ?? sess.duration ?? 0);
    if (!durationMinutes && scheduledStartTime && scheduledEndTime) {
      try {
        const diffMs = new Date(scheduledEndTime) - new Date(scheduledStartTime);
        if (diffMs > 0) durationMinutes = Math.round(diffMs / 60000);
      } catch {
        durationMinutes = 30;
      }
    }
    if (!durationMinutes) durationMinutes = 30;

    const status = cleanPdfText(sess.status || 'UPCOMING').toUpperCase();
    const orderIndex = Number(sess.orderIndex ?? idx);

    return {
      id: String(id),
      title,
      track,
      orderIndex,
      speakerName: speakerName || 'Speaker TBA',
      speakerAffiliation: speakerAffiliation || '',
      scheduledStartTime,
      scheduledEndTime,
      currentStartTime,
      currentEndTime,
      durationMinutes,
      delayMinutes,
      status
    };
  }).filter(Boolean);

  // 4. Normalize Tracks
  // Start from explicit tracks array if provided
  let trackList = [];
  if (Array.isArray(data.tracks) && data.tracks.length > 0) {
    trackList = data.tracks.map((t, i) => {
      if (typeof t === 'string') {
        const name = cleanPdfText(t);
        return { id: `track_${i}`, name };
      }
      return {
        id: String(t.id || t._id || `track_${i}`),
        name: cleanPdfText(t.name || t.title || `Track ${i + 1}`)
      };
    });
  }

  // If no explicit tracks, deduce from session tracks
  if (trackList.length === 0) {
    const discoveredTracks = new Set();
    normalizedSessions.forEach(s => discoveredTracks.add(s.track));
    if (discoveredTracks.size === 0) {
      discoveredTracks.add('Track A');
    }
    trackList = Array.from(discoveredTracks).map((tName, i) => ({
      id: `track_${i}`,
      name: tName
    }));
  }

  // Group and sort sessions by track
  const trackMap = new Map();
  trackList.forEach(t => {
    trackMap.set(t.name.toLowerCase(), {
      ...t,
      sessions: []
    });
  });

  // Assign sessions to tracks
  normalizedSessions.forEach(session => {
    const trackKey = session.track.toLowerCase();
    if (!trackMap.has(trackKey)) {
      const newTrack = {
        id: `track_${trackMap.size}`,
        name: session.track,
        sessions: []
      };
      trackMap.set(trackKey, newTrack);
      trackList.push(newTrack);
    }
    trackMap.get(trackKey).sessions.push(session);
  });

  // Sort sessions within each track by orderIndex, then scheduled time
  const groupedTracks = Array.from(trackMap.values()).map(track => {
    track.sessions.sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      if (a.scheduledStartTime && b.scheduledStartTime) {
        return new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime);
      }
      return 0;
    });

    const trackDelay = track.sessions.reduce((max, s) => Math.max(max, s.delayMinutes), 0);
    return {
      ...track,
      sessionCount: track.sessions.length,
      maxDelayMinutes: trackDelay
    };
  });

  // 5. Export metadata
  const exportTimestamp = data.exportTimestamp || new Date().toISOString();

  return {
    event,
    tracks: groupedTracks,
    totalSessions: normalizedSessions.length,
    exportTimestamp
  };
}

module.exports = {
  normalizeRunOfShowData
};
