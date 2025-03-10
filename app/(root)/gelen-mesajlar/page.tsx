"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@app/components/ui/card";
import { Conversation } from "@/types";
import { MessageSquare } from "lucide-react";
import ConversationCard from "@app/components/root/conversation-card";

// Gelen mesajlar sayfası
export default function ReceivedMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      {/* Şık başlık eklendi */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Gelen Mesajlar</h1>
      </div>

      <div className="space-y-4">
        {isLoadingReceivedConversations ? (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : receivedConversations && receivedConversations.length > 0 ? (
          receivedConversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} deleteMutation={deleteMutation} type="received" />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Henüz bir mesaj almadınız</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
