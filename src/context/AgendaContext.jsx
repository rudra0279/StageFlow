import React, { createContext, useState, useEffect } from 'react';
import { agendaService } from '../services/agendaService';
import { MOCK_AGENDA } from '../constants/mockData';

export const AgendaContext = createContext(null);

export const AgendaProvider = ({ children }) => {
  const [agenda, setAgenda] = useState(MOCK_AGENDA);
  const [activeItem, setActiveItem] = useState(MOCK_AGENDA[1]); // Dr. Sophia Chen live
  const [remainingSeconds, setRemainingSeconds] = useState(840); // 14 mins default
  const [isTimerRunning, setIsTimerRunning] = useState(true);

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

  const jumpToSegment = (agendaId) => {
    const found = agenda.find((item) => item.id === agendaId);
    if (found) {
      setAgenda((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.id === agendaId ? 'LIVE' : item.order < found.order ? 'COMPLETED' : 'UPCOMING',
        }))
      );
      setActiveItem(found);
      setRemainingSeconds(found.allocatedMinutes * 60);
      setIsTimerRunning(true);
    }
  };

  const adjustActiveTime = (secondsDelta) => {
    setRemainingSeconds((prev) => prev + secondsDelta);
  };

  const value = {
    agenda,
    activeItem,
    remainingSeconds,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    jumpToSegment,
    adjustActiveTime,
    setAgenda,
  };

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};
