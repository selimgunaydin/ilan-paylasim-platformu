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
import MessagesView from "../mesaj-detay";
import { cn } from "@/lib/utils";
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

interface MessagesProps {
  type: "received" | "sent";
}

export default function Messages({ type }: MessagesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch unread messages on mount
  useEffect(() => {
    dispatch(fetchUnreadMessages());
  }, [dispatch]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: any) => {
      dispatch(fetchUnreadMessages());
      queryClient.invalidateQueries({ queryKey: ["conversations", type] });
    };

    socket.on("messageNotification", handleNewMessage);
    socket.on("newConversation", handleNewMessage);

    return () => {
      socket.off("messageNotification", handleNewMessage);
      socket.off("newConversation", handleNewMessage);
    };
  }, [socket, isConnected, dispatch, queryClient, type]);

  // Fetch conversations based on type
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<
    Conversation[]
  >({
    queryKey: ["conversations", type],
    queryFn: () =>
      fetch(`/api/conversations/${type}`).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${type} conversations`);
        return res.json();
      }),
  });

  // Update unread messages when conversations load
  useEffect(() => {
    if (conversations) {
      dispatch(fetchUnreadMessages());
    }
  }, [conversations, dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  // Delete conversation mutation
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
      queryClient.invalidateQueries({ queryKey: ["conversations", type] });
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

  // Mark conversation as read
  const markConversationAsRead = async (conversationId: number) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "PATCH",
      });
      dispatch(fetchUnreadMessages());
      queryClient.invalidateQueries({ queryKey: ["conversations", type] });
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
    <div
      className={cn(
        "md:container mx-auto px-0 md:px-4 py-8 h-[calc(100vh-2rem)] md:h-screen flex flex-col",
        selectedConversationId && isMobile && "py-0"
      )}
    >
      {!selectedConversationId && isMobile && (
        <div className="mb-4 px-4 md:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {type === "received" ? "Alınan Mesajlar" : "Gönderilen Mesajlar"}
          </h1>
          <p className="text-gray-600">
            {type === "received"
              ? "Alınan mesajlarınızı görüntüleyebilirsiniz"
              : "Gönderilen mesajlarınızı görüntüleyebilirsiniz"}
          </p>
        </div>
      )}

      {!isMobile && (
        <div className="mb-4 px-4 md:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {type === "received" ? "Alınan Mesajlar" : "Gönderilen Mesajlar"}
          </h1>
          <p className="text-gray-600">
            {type === "received"
              ? "Alınan mesajlarınızı görüntüleyebilirsiniz"
              : "Gönderilen mesajlarınızı görüntüleyebilirsiniz"}
          </p>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Toggle between list and chat; Desktop: Side-by-side */}
        {isMobile && selectedConversationId ? (
          <MessagesView
            conversationId={selectedConversationId.toString()}
            type={type}
            onBack={handleBack}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Conversation List */}
            <div className="col-span-1 h-full overflow-y-auto border-gray-200 md:pr-4 pt-4 mx-4 md:mx-0">
              {isLoadingConversations ? (
                <SkeletonWrapper />
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    deleteMutation={deleteMutation}
                    type={type}
                    onCardClick={() => handleConversationClick(conversation.id)}
                    isSelected={selectedConversationId === conversation.id}
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {type === "received"
                        ? "Henüz bir mesaj almadınız"
                        : "Henüz bir mesaj göndermediniz"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Messages View (Desktop only) */}
            <div className="hidden md:block md:col-span-2 h-full overflow-y-auto pt-4">
              {selectedConversationId ? (
                <MessagesView
                  conversationId={selectedConversationId.toString()}
                  type={type}
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
