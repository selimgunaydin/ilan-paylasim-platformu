'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useAppDispatch } from '@/redux/hooks';
import { fetchUnreadMessages, addMessageNotification } from '@/redux/slices/messageSlice';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

/**
 * Websocket üzerinden mesaj bildirimlerini dinleyen ve Redux store'u güncelleyen bileşen.
 * Herhangi bir görsel çıktı üretmez, sadece arka planda çalışır.
 */
export function SocketMessageListener() {
  const { socket, isConnected } = useSocket();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Yeni mesaj bildirimi alındığında
    const handleMessageNotification = (data: any) => {
      // Redux store'u güncelle
      dispatch(fetchUnreadMessages());
      
      // Bildirim olarak ekle
      if (data.message && data.message.senderId) {
        try {
          dispatch(addMessageNotification({
            id: data.message.id,
            senderId: data.message.senderId,
            senderName: data.senderName || 'Bir kullanıcı',
            message: data.message.content || 'Yeni mesaj gönderdi',
            createdAt: data.message.createdAt || new Date().toISOString(),
            isRead: false
          }));
          
          // Tarayıcı bildirimi göster (kullanıcı izin verdiyse)
          if (Notification.permission === 'granted') {
            new Notification('Yeni Mesaj', {
              body: data.message.content || 'Yeni bir mesaj aldınız',
              icon: '/favicon.ico'
            });
          }
          
          // Ekranda bildirim göster (toast)
          toast({
            title: 'Yeni Mesaj',
            description: data.message.content || 'Yeni bir mesaj aldınız',
            duration: 5000
          });
        } catch (error) {
          console.error('Mesaj bildirimi işlenirken hata oluştu:', error);
        }
      }
    };

    // Socket olaylarını dinle
    socket.on('messageNotification', handleMessageNotification);
    
    // Yeni bir konuşma başlatıldığında da unread mesajları güncelle
    socket.on('newConversation', () => {
      dispatch(fetchUnreadMessages());
    });
    
    // Temizlik işlemleri
    return () => {
      socket.off('messageNotification', handleMessageNotification);
      socket.off('newConversation');
    };
  }, [socket, isConnected, dispatch, user, toast]);

  // Hiçbir görsel çıktı üretmez
  return null;
} 