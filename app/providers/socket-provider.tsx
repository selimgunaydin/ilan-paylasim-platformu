'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
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
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Okunmamış mesaj sayısını al
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread/count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Okunmamış mesaj sayısı alınamadı:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const userWithToken = user as { token?: string };
    const token = userWithToken.token;

    if (!token) {
      toast({
        title: 'Bağlantı Hatası',
        description: 'Kimlik doğrulama bilgisi eksik.',
        variant: 'destructive',
      });
      return;
    }

    const socketInstance = io('http://localhost:3001', {
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

    // Yeni mesaj geldiğinde okunmamış mesaj sayısını güncelle
    socketInstance.on('messageNotification', () => {
      setUnreadCount((prev) => prev + 1);
    });

    // Mesaj okunduğunda sayıyı güncelle
    socketInstance.on('messageRead', () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, toast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
} 