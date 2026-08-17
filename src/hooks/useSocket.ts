import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io();
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return socket;
};
