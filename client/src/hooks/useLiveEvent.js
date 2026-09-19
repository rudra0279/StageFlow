import { useContext } from 'react';
import { EventContext } from '../context/EventContext';

export const useLiveEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useLiveEvent must be used within an EventProvider');
  }
  return context;
};
