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

export default function SentMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false); // Track mobile view

  // Check if mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    dispatch(fetchUnreadMessages());
  }, [dispatch]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: any) => {
      console.log('Gönderilen Mesajlar: Yeni mesaj bildirimi:', data);
      dispatch(fetchUnreadMessages());
      queryClient.invalidateQueries({ queryKey: ["conversations", "sent"] });
    };

    socket.on('messageNotification', handleNewMessage);
    socket.on('newConversation', handleNewMessage);

    return () => {
      socket.off('messageNotification', handleNewMessage);
      socket.off('newConversation', handleNewMessage);
    };
  }, [socket, isConnected, dispatch, queryClient]);

  const { data: sentConversations, isLoading: isLoadingSentConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations", "sent"],
    queryFn: () => fetch("/api/conversations/sent").then(res => {
      if (!res.ok) throw new Error('Failed to fetch sent conversations');
      return res.json();
    }),
  });

  useEffect(() => {
    if (sentConversations) {
      dispatch(fetchUnreadMessages());
    }
  }, [sentConversations, dispatch]);

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
      dispatch(fetchUnreadMessages());
      if (selectedConversationId) {
        setSelectedConversationId(null); // Reset selection if deleted
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Konuşma silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const markConversationAsRead = async (conversationId: number) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PATCH',
      });
      dispatch(fetchUnreadMessages());
      queryClient.invalidateQueries({ queryKey: ["conversations", "sent"] });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const handleConversationClick = (conversationId: number) => {
    markConversationAsRead(conversationId);
    setSelectedConversationId(conversationId);
  };

  const handleBack = () => {
    setSelectedConversationId(null); // Go back to conversation list
  };

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Gönderilen Mesajlar</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Mobile: Toggle between list and chat; Desktop: Side-by-side */}
        {isMobile && selectedConversationId ? (
          <MessagesView
            conversationId={selectedConversationId.toString()}
            type="sent"
            onBack={handleBack} // Pass custom back handler
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Conversation List */}
            <div className="col-span-1 h-full overflow-y-auto border-r border-gray-200 md:pr-4">
              {isLoadingSentConversations ? (
                <SkeletonWrapper />
              ) : sentConversations && sentConversations.length > 0 ? (
                sentConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    deleteMutation={deleteConversationMutation}
                    type="sent"
                    onCardClick={() => handleConversationClick(conversation.id)}
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

            {/* Messages View (Desktop only) */}
            <div className="hidden md:block md:col-span-2 h-full overflow-y-auto">
              {selectedConversationId ? (
                <MessagesView
                  conversationId={selectedConversationId.toString()}
                  type="sent"
                  onBack={handleBack}
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
        )}
      </div>
    </div>
  );
}