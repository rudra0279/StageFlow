import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { SocketContext } from './SocketContext';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { eventApi } from '../api/eventApi';
import { playAlertChime } from '../utils/sound';

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const { socket, joinEvent, leaveEvent } = useContext(SocketContext);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [delayNotice, setDelayNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load event initially via REST
  const loadEvent = useCallback(async (eventId) => {
    if (!eventId) return;
    try {
      setLoading(true);
      setCurrentEventId(eventId);
      joinEvent(eventId);

      const res = await eventApi.getEventById(eventId);
      const { event, sessions: agendaSessions, announcements } = res.data;

      setEventData(event);
      setSessions(agendaSessions);

      // Determine active and next sessions
      const live = agendaSessions.find((s) => s.status === 'LIVE') || agendaSessions[0];
      setActiveSession(live || null);

      if (live) {
        const next = agendaSessions.find(
          (s) => s.orderIndex > live.orderIndex && s.status === 'UPCOMING'
        );
        setNextSession(next || null);
      }

      if (announcements && announcements.length > 0) {
        setActiveAlert(announcements[0]);
      }
    } catch (err) {
      console.error('[EventContext] Error loading event:', err);
    } finally {
      setLoading(false);
    }
  }, [joinEvent]);

  // Listen to live socket events
  useEffect(() => {
    if (!socket || !currentEventId) return;

    // 1. Full Agenda Updated (cascaded delay or session reordered)
    const handleAgendaUpdated = (payload) => {
      console.log('[Socket] AGENDA_UPDATED received:', payload);
      if (payload.sessions) {
        setSessions(payload.sessions);
        const live = payload.sessions.find((s) => s.status === 'LIVE');
        if (live) {
          setActiveSession(live);
          const next = payload.sessions.find(
            (s) => s.orderIndex > live.orderIndex && s.status === 'UPCOMING'
          );
          setNextSession(next || null);
        }
      }
      if (payload.healthStatus) {
        setEventData((prev) => prev ? {
          ...prev,
          healthStatus: payload.healthStatus,
          totalDelayMinutes: payload.totalDelayMinutes ?? prev.totalDelayMinutes
        } : null);
      }
    };

    // 2. Delay Broadcast (triggers sticky alert and sound)
    const handleDelayBroadcast = (payload) => {
      console.log('[Socket] DELAY_BROADCAST received:', payload);
      playAlertChime();
      setDelayNotice({
        delayMinutes: payload.delayMinutes,
        reason: payload.reason,
        targetSessionTitle: payload.targetSessionTitle,
        timestamp: new Date()
      });
      // Auto-clear delay toast after 12 seconds
      setTimeout(() => setDelayNotice(null), 12000);
    };

    // 3. Live Session Started
    const handleSessionStarted = (payload) => {
      console.log('[Socket] SESSION_STARTED received:', payload);
      setActiveSession(payload.activeSession);
      setNextSession(payload.nextSession);
    };

    // 4. Urgent Stage Direction or Alert
    const handleStageAlert = (payload) => {
      console.log('[Socket] STAGE_ALERT received:', payload);
      playAlertChime();
      setActiveAlert(payload);
    };

    // 5. Script Generated and ready
    const handleScriptReady = (payload) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s._id === payload.sessionId) {
            return {
              ...s,
              aiScripts: {
                ...s.aiScripts,
                [payload.scriptType]: payload.content
              }
            };
          }
          return s;
        })
      );
      if (activeSession && activeSession._id === payload.sessionId) {
        setActiveSession((prev) => ({
          ...prev,
          aiScripts: {
            ...prev.aiScripts,
            [payload.scriptType]: payload.content
          }
        }));
      }
    };

    socket.on(SOCKET_EVENTS.AGENDA_UPDATED, handleAgendaUpdated);
    socket.on(SOCKET_EVENTS.DELAY_BROADCAST, handleDelayBroadcast);
    socket.on(SOCKET_EVENTS.SESSION_STARTED, handleSessionStarted);
    socket.on(SOCKET_EVENTS.STAGE_ALERT, handleStageAlert);
    socket.on(SOCKET_EVENTS.AI_SCRIPT_READY, handleScriptReady);

    return () => {
      socket.off(SOCKET_EVENTS.AGENDA_UPDATED, handleAgendaUpdated);
      socket.off(SOCKET_EVENTS.DELAY_BROADCAST, handleDelayBroadcast);
      socket.off(SOCKET_EVENTS.SESSION_STARTED, handleSessionStarted);
      socket.off(SOCKET_EVENTS.STAGE_ALERT, handleStageAlert);
      socket.off(SOCKET_EVENTS.AI_SCRIPT_READY, handleScriptReady);
    };
  }, [socket, currentEventId, activeSession]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const dismissDelayNotice = () => {
    setDelayNotice(null);
  };

  return (
    <EventContext.Provider
      value={{
        currentEventId,
        event: eventData,
        sessions,
        activeSession,
        nextSession,
        activeAlert,
        delayNotice,
        loading,
        loadEvent,
        dismissAlert,
        dismissDelayNotice,
        setSessions,
        setActiveSession
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
