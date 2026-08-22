import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!globalSocket) {
    globalSocket = io({
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return globalSocket;
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(() => {
    if (typeof window !== 'undefined') {
      return getSocket();
    }
    return null;
  });
  const [isConnected, setIsConnected] = useState<boolean>(() => globalSocket?.connected || false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    setIsConnected(s.connected);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket, isConnected };
};
