import React, { createContext, useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { MOCK_EVENTS } from '../constants/mockData';

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [activeEvent, setActiveEvent] = useState(MOCK_EVENTS[0]);
  const [loading, setLoading] = useState(false);
  const [timeDrift, setTimeDrift] = useState(2); // +2 mins drift

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await eventService.getEvents();
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setActiveEvent(data[0]);
          setTimeDrift(data[0].timeDriftMinutes || 0);
        }
      } catch (err) {
        console.warn('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const selectEvent = (eventId) => {
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setActiveEvent(found);
      setTimeDrift(found.timeDriftMinutes || 0);
    }
  };

  const updateDrift = (deltaMinutes) => {
    setTimeDrift((prev) => prev + deltaMinutes);
  };

  const value = {
    events,
    activeEvent,
    selectEvent,
    loading,
    timeDrift,
    updateDrift,
    setActiveEvent,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
