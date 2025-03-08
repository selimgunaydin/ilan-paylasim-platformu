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
// Conversation tipi
type Conversation = {
  id: number;
  listingId: number;
  senderId: number;
  receiverId: number;
  createdAt: string;
  listingTitle: string;
  isRead: boolean; // isRead alanını ekledik
  lastMessage?: {
    id: number;
    isRead: boolean;
  };
  receiver: {
    id: number;
    username: string;
    profileImage: string | null;
    gender: string;
    avatar: string | null;
    lastSeen: string;
  };
};

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
            <Card key={conversation.id} className="hover:bg-accent/50 transition-colors">
              <div 
                onClick={() => router.push(`/mesajlar/${conversation.id}?tab=sent`)}
                className="cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={getProfileImageUrl(
                            conversation.receiver?.profileImage,
                            conversation.receiver?.gender || "unspecified",
                            conversation.receiver?.avatar,
                          )}
                          alt={conversation.receiver?.username}
                        />
                        <AvatarFallback>
                          {conversation.receiver?.username?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {conversation.receiver?.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.listingTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatRelativeDate(new Date(conversation.createdAt))}
                        </span>
                        {/* Son mesajın okundu durumunu göster */}
                        {conversation.lastMessage && (
                          <span className="text-muted-foreground">
                            {conversation.lastMessage.isRead ? (
                              <CheckCheck className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
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
                              onClick={() => deleteConversationMutation.mutate(conversation.id)}
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
              <p className="text-muted-foreground">Henüz bir görüşme başlatmadınız</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}