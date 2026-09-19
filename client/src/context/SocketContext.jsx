import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { SOCKET_EVENTS } from '../constants/socketEvents';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected: ${newSocket.id}`);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinEvent = (eventId) => {
    if (socket && eventId) {
      socket.emit(SOCKET_EVENTS.JOIN_EVENT, {
        eventId,
        role: user?.role || 'GUEST'
      });
    }
  };

  const leaveEvent = (eventId) => {
    if (socket && eventId) {
      socket.emit(SOCKET_EVENTS.LEAVE_EVENT, { eventId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinEvent,
        leaveEvent
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
