"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@app/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Conversation } from "@/types";
import ConversationCard from "@app/components/root/conversation-card";
import { useAppDispatch } from "@/redux/hooks";
import { fetchUnreadMessages } from "@/redux/slices/messageSlice";
import { useEffect, useState } from "react";
import { useSocket } from "@/providers/socket-provider";
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

// Gelen mesajlar sayfası
export default function ReceivedMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | undefined
  >(undefined);

  // Komponent yüklendiğinde okunmamış mesaj sayısını güncelle
  useEffect(() => {
    dispatch(fetchUnreadMessages());
  }, [dispatch]);

  // Socket dinleyicilerini ayarla
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: any) => {
      console.log("Gelen Mesajlar: Yeni mesaj bildirimi:", data);
      dispatch(fetchUnreadMessages());
      queryClient.invalidateQueries({
        queryKey: ["conversations", "received"],
      });
    };

    socket.on("messageNotification", handleNewMessage);
    socket.on("newConversation", handleNewMessage);

    return () => {
      socket.off("messageNotification", handleNewMessage);
      socket.off("newConversation", handleNewMessage);
    };
  }, [socket, isConnected, dispatch, queryClient]);

  // Gelen mesajlar sorgusu
  const {
    data: receivedConversations,
    isLoading: isLoadingReceivedConversations,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations", "received"],
    queryFn: () =>
      fetch("/api/conversations/received").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch received conversations");
        return res.json();
      }),
  });

  // Mesajlar yüklendiğinde okunmamış mesaj sayısını güncelle
  useEffect(() => {
    if (receivedConversations) {
      dispatch(fetchUnreadMessages());
    }
  }, [receivedConversations, dispatch]);

  // Konuşma silme mutation'ı
  const deleteMutation = useMutation({
    mutationFn: (conversationId: number) =>
      fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      }).then((res) => {
        if (!res.ok) throw new Error("Konuşma silinemedi");
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Konuşma başarıyla silindi",
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations", "received"],
      });
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
        method: "PATCH",
      });
      dispatch(fetchUnreadMessages());
      queryClient.invalidateQueries({
        queryKey: ["conversations", "received"],
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
        <h1 className="text-2xl font-semibold">Gelen Mesajlar</h1>
      </div>

      {/* Split layout: Sol - Mesaj listesi, Sağ - Mesaj görünümü */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Sol taraf: Mesaj listesi */}
        <div className="col-span-1 h-full overflow-y-auto border-r border-gray-200 pr-4">
          {isLoadingReceivedConversations ? (
            <SkeletonWrapper />
          ) : receivedConversations && receivedConversations.length > 0 ? (
            receivedConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                deleteMutation={deleteMutation}
                type="received"
                onCardClick={() => markConversationAsRead(conversation.id)}
                isSelected={selectedConversationId === conversation.id}
                className="cursor-pointer hover:bg-gray-100 transition-colors"
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Henüz bir mesaj almadınız</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ taraf: Mesaj görünümü */}
        <div className="col-span-2 h-full overflow-y-auto">
          {selectedConversationId ? (
            <MessagesView
              conversationId={selectedConversationId.toString()}
              type="received"
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