'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@app/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Conversation } from "@/types";
import ConversationCard from "@app/components/root/conversation-card";

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

  // Gönderilen mesajlar sorgusu
  const { data: sentConversations, isLoading: isLoadingSentConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations", "sent"],
    queryFn: () => fetch("/api/conversations/sent").then(res => {
      if (!res.ok) throw new Error('Failed to fetch sent conversations');
      return res.json();
    }),
  });

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
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Konuşma silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Gönderilen Mesajlar</h1>
      </div>

      <div className="space-y-4">
        {isLoadingSentConversations ? (
          <SkeletonWrapper />
        ) : sentConversations && sentConversations.length > 0 ? (
          sentConversations.map((conversation) => (
            <ConversationCard 
              key={conversation.id} 
              conversation={conversation} 
              deleteMutation={deleteConversationMutation} 
              type="sent" 
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Henüz bir görüşme başlatmadınız</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}