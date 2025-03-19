'use client';

import React from 'react';
import { SocketMessageListener } from '@/components/root/socket-message-listener';
import { useAuth } from '@/hooks/use-auth';

/**
 * Mesaj bildirimlerini global olarak dinleyen provider.
 * Bu provider uygulama genelinde websocket mesaj bildirimlerini dinler ve Redux store'u günceller.
 */
export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return (
    <>
      {/* Kullanıcı oturum açmışsa socket dinleyiciyi aktif et */}
      {user && <SocketMessageListener />}
      {children}
    </>
  );
} 