'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = session.user.token;

    if (!token) {
      toast({
        title: 'Bağlantı Hatası',
        description: 'Kimlik doğrulama bilgisi eksik.',
        variant: 'destructive',
      });
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('authenticate', token);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Bağlantı hatası:', err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session, toast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
} 