import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { agendaService } from '../services/agendaService';
import { MOCK_AGENDA, MOCK_TRACKS } from '../constants/mockData';

export const AgendaContext = createContext(null);

export const AgendaProvider = ({ children }) => {
  const [tracks, setTracks] = useState(MOCK_TRACKS);
  const [agenda, setAgenda] = useState(MOCK_AGENDA);
  const [activeTrackId, setActiveTrackId] = useState('track_a');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('ALL');
  
  // Track-specific delays dictionary
  const [trackDelays, setTrackDelays] = useState({
    track_a: 10,
    track_b: 0,
    track_c: 5,
  });

  const [remainingSeconds, setRemainingSeconds] = useState(840); // default 14 mins
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Get active session for selected active track
  const activeItem = useMemo(() => {
    return (
      agenda.find((item) => item.trackId === activeTrackId && item.status === 'LIVE') ||
      agenda.find((item) => item.trackId === activeTrackId) ||
      agenda[0]
    );
  }, [agenda, activeTrackId]);

  // Live timer tick effect
  useEffect(() => {
    let timer = null;
    if (isTimerRunning && activeItem) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => (prev > -600 ? prev - 1 : prev));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, activeItem]);

  const toggleTimer = () => setIsTimerRunning((prev) => !prev);

  const resetTimer = (seconds = 900) => {
    setRemainingSeconds(seconds);
  };

  const selectTrack = (trackId) => {
    setActiveTrackId(trackId);
    const foundLive = agenda.find((item) => item.trackId === trackId && item.status === 'LIVE');
    if (foundLive) {
      setRemainingSeconds(foundLive.remainingSeconds || foundLive.allocatedMinutes * 60);
    }
  };

  const updateTrackDelay = useCallback((trackId, deltaMinutes) => {
    setTrackDelays((prev) => {
      const current = prev[trackId] || 0;
      const updated = Math.max(0, current + deltaMinutes);
      return { ...prev, [trackId]: updated };
    });

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const newDelay = Math.max(0, (t.delayMinutes || 0) + deltaMinutes);
          return {
            ...t,
            delayMinutes: newDelay,
            status: newDelay > 0 ? 'RUNNING_LATE' : 'ON_SCHEDULE',
          };
        }
        return t;
      })
    );
  }, []);

  const jumpToSegment = (agendaId) => {
    const found = agenda.find((item) => item.id === agendaId);
    if (found) {
      const targetTrackId = found.trackId || activeTrackId;
      setAgenda((prev) =>
        prev.map((item) => {
          if (item.trackId === targetTrackId) {
            return {
              ...item,
              status: item.id === agendaId ? 'LIVE' : item.order < found.order ? 'COMPLETED' : 'UPCOMING',
            };
          }
          return item;
        })
      );
      setActiveTrackId(targetTrackId);
      setRemainingSeconds(found.allocatedMinutes * 60);
      setIsTimerRunning(true);
    }
  };

  const adjustActiveTime = (secondsDelta) => {
    setRemainingSeconds((prev) => prev + secondsDelta);
  };

  // Helper getters for track-specific queries
  const getActiveSessionForTrack = useCallback(
    (trackId) => {
      return (
        agenda.find((item) => item.trackId === trackId && item.status === 'LIVE') ||
        agenda.find((item) => item.trackId === trackId && item.status === 'UPCOMING') ||
        null
      );
    },
    [agenda]
  );

  const getNextSessionForTrack = useCallback(
    (trackId) => {
      const trackItems = agenda.filter((item) => item.trackId === trackId);
      const liveIndex = trackItems.findIndex((item) => item.status === 'LIVE');
      if (liveIndex !== -1 && liveIndex + 1 < trackItems.length) {
        return trackItems[liveIndex + 1];
      }
      return trackItems.find((item) => item.status === 'UPCOMING') || null;
    },
    [agenda]
  );

  const getAgendaForTrack = useCallback(
    (trackId) => {
      if (!trackId || trackId === 'ALL') return agenda;
      return agenda.filter((item) => item.trackId === trackId);
    },
    [agenda]
  );

  const value = {
    tracks,
    agenda,
    activeTrackId,
    activeItem,
    selectedTrackFilter,
    trackDelays,
    remainingSeconds,
    isTimerRunning,
    setSelectedTrackFilter,
    selectTrack,
    updateTrackDelay,
    toggleTimer,
    resetTimer,
    jumpToSegment,
    adjustActiveTime,
    getActiveSessionForTrack,
    getNextSessionForTrack,
    getAgendaForTrack,
    setAgenda,
    setTracks,
  };

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};
