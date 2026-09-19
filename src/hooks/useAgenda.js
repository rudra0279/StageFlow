import { useContext } from 'react';
import { AgendaContext } from '../context/AgendaContext';

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};
