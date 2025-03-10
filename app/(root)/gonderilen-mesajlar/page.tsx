'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { MessageSquare, Trash2, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@app/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@app/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Conversation } from "@/types";
import ConversationCard from "@app/components/root/conversation-card";

// Gönderilen mesajlar sayfası
export default function SentMessages() {
  const router = useRouter();
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
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : sentConversations && sentConversations.length > 0 ? (
          sentConversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} deleteMutation={deleteConversationMutation} type="sent" />
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