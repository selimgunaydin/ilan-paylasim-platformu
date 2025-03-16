"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/redux/hooks";
import { fetchUnreadMessages } from "@/redux/slices/messageSlice";
import { useEffect } from "react";
import { useSocket } from '@/providers/socket-provider';

// Giden mesajlar sayfası
export default function SentMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();

  // Komponent yüklendiğinde okunmamış mesaj sayısını güncelle
  useEffect(() => {
    dispatch(fetchUnreadMessages());
  }, [dispatch]);

  // Socket dinleyicilerini ayarla
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Yeni bir mesaj bildiriminde konuşma listesini ve okunmamış mesaj sayısını güncelle
    const handleNewMessage = (data: any) => {
      console.log('Giden Mesajlar: Yeni mesaj bildirimi:', data);
      
      // Okunmamış mesaj sayısını güncelle
      dispatch(fetchUnreadMessages());
      
      // Konuşma listesini güncelle
      queryClient.invalidateQueries({
        queryKey: ["conversations", "sent"],
      });
    };

    // Socket olaylarını dinle
    socket.on('messageNotification', handleNewMessage);
    socket.on('newConversation', handleNewMessage);
    
    // Temizlik
    return () => {
      socket.off('messageNotification', handleNewMessage);
      socket.off('newConversation', handleNewMessage);
    };
  }, [socket, isConnected, dispatch, queryClient]);

  // ... existing code ...
} 