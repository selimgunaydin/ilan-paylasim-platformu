'use client';

import React from 'react';
import { SocketMessageListener } from '@/components/root/socket-message-listener';
import { useSession } from 'next-auth/react';

/**
 * Mesaj bildirimlerini global olarak dinleyen provider.
 * Bu provider uygulama genelinde websocket mesaj bildirimlerini dinler ve Redux store'u günceller.
 */
export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  return (
    <>
      {/* Kullanıcı oturum açmışsa socket dinleyiciyi aktif et */}
      {session?.user && <SocketMessageListener />}
      {children}
    </>
  );
} 