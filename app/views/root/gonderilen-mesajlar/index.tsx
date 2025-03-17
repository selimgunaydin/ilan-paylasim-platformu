'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@app/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Conversation } from "@/types";
import ConversationCard from "@app/components/root/conversation-card";
import { useAppDispatch } from "@/redux/hooks";
import { fetchUnreadMessages } from "@/redux/slices/messageSlice";
import { useEffect, useState } from "react";
import { useSocket } from '@/providers/socket-provider';
import MessagesView from "../messages";

// Skeleton Loader Component
function SkeletonWrapper() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <Card key={item}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Gönderilen mesajlar sayfası
export default function SentMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  // Komponent yüklendiğinde okunmamış mesaj sayısını güncelle
  useEffect(() => {
    dispatch(fetchUnreadMessages());
  }, [dispatch]);

  // Socket dinleyicilerini ayarla
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Yeni bir mesaj bildiriminde konuşma listesini ve okunmamış mesaj sayısını güncelle
    const handleNewMessage = (data: any) => {
      console.log('Gönderilen Mesajlar: Yeni mesaj bildirimi:', data);
      
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

  // Gönderilen mesajlar sorgusu
  const { data: sentConversations, isLoading: isLoadingSentConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations", "sent"],
    queryFn: () => fetch("/api/conversations/sent").then(res => {
      if (!res.ok) throw new Error('Failed to fetch sent conversations');
      return res.json();
    })
  });

  // Mesajlar yüklendiğinde okunmamış mesaj sayısını güncelle
  useEffect(() => {
    if (sentConversations) {
      dispatch(fetchUnreadMessages());
    }
  }, [sentConversations, dispatch]);

  // Konuşma silme mutation'ı
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Konuşma silinemedi');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", "sent"] });
      toast({
        title: "Başarılı",
        description: "Konuşma başarıyla silindi",
      });
      // Konuşma silindiğinde okunmamış mesaj sayısını güncelle
      dispatch(fetchUnreadMessages());
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Konuşma silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Mesajları okundu olarak işaretle
  const markConversationAsRead = async (conversationId: number) => {
    setSelectedConversationId(conversationId);
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PATCH'
      });
      // Redux state'i güncelle
      dispatch(fetchUnreadMessages());
      // Cache'i güncelle
      queryClient.invalidateQueries({
        queryKey: ["conversations", "sent"],
      });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      {/* Şık başlık */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Gönderilen Mesajlar</h1>
      </div>

      {/* Split layout: Sol - Mesaj listesi, Sağ - Mesaj görünümü */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Sol taraf: Mesaj listesi */}
        <div className="col-span-1 h-full overflow-y-auto border-r border-gray-200 pr-4">
          {isLoadingSentConversations ? (
            <SkeletonWrapper />
          ) : sentConversations && sentConversations.length > 0 ? (
            sentConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                deleteMutation={deleteConversationMutation}
                type="sent"
                onCardClick={() => markConversationAsRead(conversation.id)}
                isSelected={selectedConversationId === conversation.id}
                className="cursor-pointer hover:bg-gray-100 transition-colors"
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Henüz bir mesaj göndermediniz</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ taraf: Mesaj görünümü */}
        <div className="col-span-2 h-full overflow-y-auto">
          {selectedConversationId ? (
            <MessagesView
              conversationId={selectedConversationId.toString()}
              type="sent"
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground">
                  Bir konuşma seçerek mesajları görüntüleyin
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}