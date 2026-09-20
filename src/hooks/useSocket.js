import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const useSocket = (roomName = 'stage_control') => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Attempt socket connection
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (roomName) {
        socket.emit('join_room', { room: roomName });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      // Gracefully set fallback mock socket state
      setIsConnected(false);
    });

    socket.on('stage_update', (data) => {
      setLastMessage(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomName]);

  const emitEvent = (eventName, payload) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(eventName, payload);
    } else {
      console.log(`[useSocket Mock Emit] ${eventName}:`, payload);
      // Simulate mock event trigger locally
      setLastMessage({ eventName, payload, timestamp: new Date().toISOString() });
    }
  };

  return {
    isConnected,
    lastMessage,
    emitEvent,
    socket: socketRef.current,
  };
};
