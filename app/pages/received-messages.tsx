import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { Conversation } from "@/types";
import { Trash2, MessageSquare } from "lucide-react";
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
import { useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

// Tarih formatı yardımcı fonksiyonu
const formatRelativeDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days === 0) {
    if (hours < 1) return "Az önce";
    if (hours < 24) return `${hours} saat önce`;
    return "Bugün";
  }
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return `${Math.floor(days / 30)} ay önce`;
};

// Gelen mesajlar sayfası
export default function ReceivedMessages() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const webSocket = useWebSocket();

  // Gelen mesajlar sorgusu
  const { data: receivedConversations, isLoading: isLoadingReceivedConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations", "received"],
    queryFn: () => fetch("/api/conversations/received").then(res => {
      if (!res.ok) throw new Error('Failed to fetch received conversations');
      return res.json();
    }),
  });

  // WebSocket event listener'ı
  useEffect(() => {
    // WebSocket olaylarını dinle
    const handleWebSocketMessage = (event: CustomEvent) => {
      try {
        const data = event.detail;
        if (data.type === "conversation_deleted") {
          queryClient.invalidateQueries({ queryKey: ["conversations", "received"] });
          toast({
            title: "Konuşma silindi",
            description: "Konuşma başarıyla silindi",
          });
        }
      } catch (error) {
        console.error("WebSocket mesaj işleme hatası:", error);
      }
    };

    // Custom event listener'ı ekle
    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener);
    };
  }, [queryClient, toast]);

  // Konuşma silme mutation'ı
  const deleteMutation = useMutation({
    mutationFn: (conversationId: number) =>
      fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      }).then(res => {
        if (!res.ok) throw new Error('Konuşma silinemedi');
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Konuşma başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["conversations", "received"] });
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
            <Card key={conversation.id} className="hover:bg-accent/50 transition-colors">
              {/* Tüm kart tıklanabilir yapıldı */}
              <div 
                onClick={() => router.push(`/mesajlar/${conversation.id}`)}
                className="cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Sol taraf - Profil ve kullanıcı bilgileri */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={getProfileImageUrl(
                            conversation.sender?.profileImage,
                            conversation.sender?.gender || "unspecified",
                            conversation.sender?.avatar,
                          )}
                          alt={conversation.sender?.username}
                        />
                        <AvatarFallback>
                          {conversation.sender?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {conversation.sender?.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.listingTitle}
                        </p>
                      </div>
                    </div>

                    {/* Sağ taraf - Tarih ve silme butonu */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatRelativeDate(new Date(conversation.createdAt))}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 -mr-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konuşmayı Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteMutation.mutate(conversation.id);
                              }}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
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