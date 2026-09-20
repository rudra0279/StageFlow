// src/services/ai/contextBuilder.js
const Event = require('../../models/Event');
const Agenda = require('../../models/Agenda');
const Speaker = require('../../models/Speaker');

/**
 * Builds the rich, contextual snapshot of the live event.
 * @param {string} eventId - MongoDB ObjectId string of the event
 * @param {object} overrides - Any caller-supplied parameters (tone, maxLength, rawMessage, track, etc.)
 * @returns {Promise<object>} Contextual object
 */
async function buildEventContext(eventId, overrides = {}) {
  let event = null;
  if (eventId) {
    event = await Event.findById(eventId);
  }

  let agendaList = [];
  let currentSession = null;
  let currentSpeaker = null;
  let nextSession = null;
  let scheduleChanges = [];
  let otherTracks = [];
  let trackDelayMinutes = 0;

  const trackFilter = overrides.track || overrides.trackId || null;

  if (eventId) {
    agendaList = await Agenda.find({ eventId })
      .populate('speakerId')
      .sort({ orderIndex: 1, startTime: 1 });

    let filteredAgenda = agendaList;
    if (trackFilter) {
      const matched = agendaList.filter((item) => {
        const t = item.track || item.trackId || null;
        return t && t.toString().toLowerCase() === trackFilter.toString().toLowerCase();
      });
      if (matched.length > 0) {
        filteredAgenda = matched;
      }
    }

    // Identify current session (LIVE session or currentSessionId)
    currentSession =
      filteredAgenda.find((item) => item.status === 'LIVE') ||
      (event && event.currentSessionId
        ? filteredAgenda.find((item) => item._id.toString() === event.currentSessionId.toString())
        : null) ||
      filteredAgenda.find((item) => item.status === 'UPCOMING') ||
      null;

    // Identify next session
    if (currentSession) {
      nextSession =
        filteredAgenda.find(
          (item) => item.status === 'UPCOMING' && item.orderIndex > currentSession.orderIndex
        ) ||
        filteredAgenda.find(
          (item) => item.status === 'UPCOMING' && item._id.toString() !== currentSession._id.toString()
        ) ||
        null;
    } else {
      nextSession = filteredAgenda.find((item) => item.status === 'UPCOMING') || null;
    }

    // Resolve current speaker
    if (currentSession && currentSession.speakerId) {
      currentSpeaker = currentSession.speakerId;
    } else if (overrides.speakerId) {
      currentSpeaker = await Speaker.findById(overrides.speakerId);
    }

    // Track delay calculation
    trackDelayMinutes = filteredAgenda.reduce(
      (max, item) => Math.max(max, item.delayMinutes || 0),
      0
    );

    // Build other tracks summary
    const allTrackNames = Array.from(
      new Set(agendaList.map((item) => item.track || item.trackId).filter(Boolean))
    );
    const otherTrackNames = allTrackNames.filter(
      (t) => !trackFilter || t.toLowerCase() !== trackFilter.toLowerCase()
    );
    otherTracks = otherTrackNames.map((tName) => {
      const sessionsOnTrack = agendaList.filter((item) => (item.track || item.trackId) === tName);
      const live = sessionsOnTrack.find((s) => s.status === 'LIVE') || sessionsOnTrack[0] || null;
      const next =
        sessionsOnTrack.find((s) => s.status === 'UPCOMING' && (!live || s.orderIndex > live.orderIndex)) ||
        null;
      return {
        track: tName,
        currentSession: live ? { id: live._id, title: live.title } : null,
        nextSession: next ? { id: next._id, title: next.title } : null,
      };
    });

    // Build schedule changes log (sessions with delays or shifted timings)
    scheduleChanges = agendaList
      .filter((item) => item.delayMinutes > 0 || item.status === 'DELAYED')
      .map((item) => ({
        sessionId: item._id,
        sessionTitle: item.title,
        delayMinutes: item.delayMinutes,
        status: item.status,
        startTime: item.startTime,
        endTime: item.endTime,
      }));
  }

  const context = {
    eventId: eventId || overrides.eventId || null,
    eventName: (event && event.name) || overrides.eventName || 'Live Event',
    venue: (event && event.venue) || overrides.venue || 'Main Stage',
    audience: (event && event.audience) || overrides.audience || 'College students, mentors, and guests',
    eventStatus: (event && event.status) || 'UPCOMING',
    eventHealth: (event && event.eventHealth) || 'ON_TRACK',
    delayTotalMinutes: (event && event.delayTotalMinutes) || 0,
    track: trackFilter,
    currentTrack: trackFilter,
    trackDelayMinutes,
    otherTracks,
    currentSession: currentSession
      ? {
          id: currentSession._id,
          title: currentSession.title,
          description: currentSession.description,
          type: currentSession.type,
          status: currentSession.status,
          room: currentSession.room,
          track: currentSession.track || currentSession.trackId || trackFilter,
          startTime: currentSession.startTime,
          endTime: currentSession.endTime,
          durationMinutes: currentSession.durationMinutes,
          delayMinutes: currentSession.delayMinutes,
        }
      : overrides.currentSession || null,
    currentSpeaker: currentSpeaker
      ? {
          id: currentSpeaker._id,
          name: currentSpeaker.name,
          designation: currentSpeaker.designation,
          organization: currentSpeaker.organization,
          topic: currentSpeaker.topic,
          bio: currentSpeaker.bio,
          pronunciationGuide:
            currentSpeaker.pronunciationGuide || overrides.pronunciationGuide || null,
        }
      : overrides.currentSpeaker || null,
    nextSession: nextSession
      ? {
          id: nextSession._id,
          title: nextSession.title,
          description: nextSession.description,
          type: nextSession.type,
          room: nextSession.room,
          track: nextSession.track || nextSession.trackId || trackFilter,
          startTime: nextSession.startTime,
          endTime: nextSession.endTime,
          speakerName: nextSession.speakerId ? nextSession.speakerId.name : null,
          speakerDesignation: nextSession.speakerId ? nextSession.speakerId.designation : null,
          speakerPronunciation: nextSession.speakerId
            ? nextSession.speakerId.pronunciationGuide
            : null,
        }
      : overrides.nextSession || null,
    scheduleChanges,
    tone: overrides.tone || 'professional and engaging',
    maxLength: overrides.maxLength || 100,
    rawMessage: overrides.rawMessage || overrides.message || null,
    announcementType: overrides.announcementType || overrides.type || 'GENERAL',
    delayMinutes:
      overrides.delayMinutes !== undefined
        ? overrides.delayMinutes
        : trackDelayMinutes || (event ? event.delayTotalMinutes : 0),
    speechContext: overrides.speechContext || overrides.speechTracking || null,
  };

  return context;
}

module.exports = { buildEventContext };
