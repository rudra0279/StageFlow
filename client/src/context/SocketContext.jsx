import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { SOCKET_EVENTS } from '../constants/socketEvents';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const currentToken = token || localStorage.getItem('stagepilot_token');

    const newSocket = io(socketUrl, {
      autoConnect: true,
      auth: {
        token: currentToken
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected securely: ${newSocket.id}`);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (err) => {
      console.warn('[Socket] Security or protocol error:', err?.message || err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinEvent = (eventId) => {
    if (socket && eventId) {
      const currentToken = token || localStorage.getItem('stagepilot_token');
      socket.emit(SOCKET_EVENTS.JOIN_EVENT, {
        eventId,
        role: user?.role || 'AUDIENCE',
        token: currentToken
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

export default SocketProvider;
