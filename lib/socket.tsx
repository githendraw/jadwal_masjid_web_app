'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SocketContextValue {
  socket: any; // SocketIOClient
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Dynamically import socket.io-client
    import('socket.io-client').then((io) => {
      const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
      const client = io.default(SOCKET_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      setSocket(client);

      return () => {
        client.disconnect();
      };
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
