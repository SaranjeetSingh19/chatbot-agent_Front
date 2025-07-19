 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;


export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be within SocketProvider');
  return ctx;
};

export const SocketProvider = ({ children }) => {
  const [userSocket, setUserSocket] = useState(null);
  const [agentSocket, setAgentSocket] = useState(null);

  const connectUser = () => {
    if (userSocket && userSocket.connected) return;

    const socket = io(`${WEBSOCKET_URL}/user`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('reconnect', (attempt) => {
    console.log(`User reconnected after ${attempt} attempts`);
    const storedName = localStorage.getItem('chatUsername');
    if (storedName) {
      socket.emit('identifyUser', { username: storedName });
    }
  });
  

    socket.on('connect', () => {
      console.log('User socket connected');
      const storedName = localStorage.getItem('chatUsername');
      if (storedName) {
        socket.emit('identifyUser', { username: storedName });
      }
    });

    socket.on('disconnect', () => {
      console.log('User socket disconnected');
    });

    setUserSocket(socket);
  };

  const connectAgent = (token) => {
    if (agentSocket || !token) return;

    
  const socket = io(`${WEBSOCKET_URL}/agent`, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

   socket.on('reconnect', (attempt) => {
    console.log(`Agent reconnected after ${attempt} attempts`);
    socket.io.opts.auth = { token };  
  });

    socket.io.on('reconnect_attempt', () => {
      socket.io.opts.auth = { token };
    });

    socket.on('connect', () => {
      console.log('Agent socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Agent socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Agent connection error:', err);
    });

    setAgentSocket(socket);
  };

  const disconnectUser = () => {
    if (userSocket) {
      userSocket.disconnect();
      setUserSocket(null);
    }
  };

  const disconnectAgent = () => {
    if (agentSocket) {
      agentSocket.disconnect();
      setAgentSocket(null);
    }
  };

  useEffect(() => {
    return () => {
      disconnectUser();
      disconnectAgent();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        userSocket,
        agentSocket,
        connectUser,
        connectAgent,
        disconnectUser,
        disconnectAgent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

