'use client'

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageForm } from "@app/components/message-form";
import { Listing } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@app/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@app/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/avatar";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import {
  CheckCheck,
  Check,
  ExternalLink,
  ArrowLeft,
  FileText,
  Image,
  File,
  Music,
  Video,
  Archive,
  Files,
  Trash2,
  Info,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Dosya tipine göre ikon döndüren yardımcı fonksiyon
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || "")) {
    return <Image className="h-5 w-5" />;
  }
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(extension || "")) {
    return <FileText className="h-5 w-5" />;
  }
  if (["mp3", "wav", "ogg", "m4a"].includes(extension || "")) {
    return <Music className="h-5 w-5" />;
  }
  if (["mp4", "webm", "mov", "m4v"].includes(extension || "")) {
    return <Video className="h-5 w-5" />;
  }
  if (["zip", "rar"].includes(extension || "")) {
    return <Archive className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
};

// Dosya türünü belirleyen yardımcı fonksiyon
const getFileType = (fileName: string): "image" | "video" | "audio" | "other" => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || "")) {
    return "image";
  }
  if (["mp4", "webm", "mov", "m4v"].includes(extension || "")) {
    return "video";
  }
  if (["mp3", "wav", "ogg", "m4a"].includes(extension || "")) {
    return "audio";
  }
  return "other";
};

// Resim görüntüleyici bileşeni
const ImageViewer = ({ src, onClose }: { src: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={onClose}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>
      <img
        src={src}
        alt="Full size"
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// Medya oynatıcı bileşeni
const MediaPlayer = ({ src, type, fileName }: { src: string; type: "video" | "audio"; fileName: string }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Video için tam ekran geçiş işleyicisi
  const toggleFullScreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  if (type === "video") {
    return (
      <div className="relative group">
        <video
          ref={videoRef}
          src={src}
          className="max-w-full rounded-lg"
          controls
          controlsList="nodownload"
          preload="metadata"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
          onClick={toggleFullScreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <audio
      src={src}
      className="w-full"
      controls
      controlsList="nodownload"
      preload="metadata"
    />
  );
};

// Tip tanımları
type Message = {
  id: number;
  content: string;
  files?: string[];
  createdAt: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
};

type Conversation = {
  id: number;
  senderId: number;
  receiverId: number;
  listingId: number;
  createdAt: string;
  isRead: boolean; // isRead alanını ekledik
};

// Mesaj içeriği bileşeni
const MessageContent = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  return (
    <div className="space-y-2">
      {message.content && (
        <div className="flex items-end gap-2">
          <p className="break-all break-words whitespace-pre-wrap overflow-wrap-anywhere">
            {message.content}
          </p>
          {isOwnMessage && (
            <span className="text-xs text-muted-foreground">
              {message.isRead ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      )}
      {message.files && message.files.length > 0 && (
        <div className="mt-2 space-y-2 bg-black/10 p-2 rounded-md">
          {message.files.map((file, index) => {
            const fileName = file.split("/").pop() || file;
            const fileUrl = `https://message-images.ilandaddy.com/${file}`;
            const fileType = getFileType(fileName);

            return (
              <div key={index} className="space-y-2">
                {fileType === "image" ? (
                  // Resim görüntüleyici
                  <div className="cursor-pointer" onClick={() => setSelectedImage(fileUrl)}>
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="max-w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                    />
                  </div>
                ) : fileType === "video" || fileType === "audio" ? (
                  // Video veya ses oynatıcı
                  <MediaPlayer src={fileUrl} type={fileType} fileName={fileName} />
                ) : (
                  // Diğer dosya türleri için link
                  <div className="flex items-center gap-2">
                    {getFileIcon(fileName)}
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm hover:underline ${
                        isOwnMessage
                          ? "text-primary-foreground/90 hover:text-primary-foreground"
                          : "text-foreground/90 hover:text-foreground"
                      }`}
                    >
                      {fileName}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {selectedImage && (
        <ImageViewer src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
};

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const referrerTab = searchParams.get("tab") || "received";
  const socket = useWebSocket();
  const endRef = React.useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useAutoScroll(endRef);

  // Konuşma detaylarını getir
  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", id],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        router.push("/dashboard");
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu konuşmaya erişim yetkiniz yok.",
          variant: "destructive",
        });
        throw new Error("Unauthorized");
      }
      return response.json();
    },
    retry: false,
    enabled: Boolean(user),
  });

  // Mesajları getir
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", id, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      
      // Eğer mesajı alanın ID'si bizimkiyle eşleşiyorsa ve okunmamış mesajlar varsa
      const hasUnreadMessages = data.some(
        (msg: Message) => msg.receiverId === user?.id && !msg.isRead
      );

      if (hasUnreadMessages) {
        markConversationAsReadMutation.mutate();
      }
      
      return data;
    },
    enabled: Boolean(user) && Boolean(id),
  });

  // Local messages state'i
  const [localMessages, setLocalMessages] = React.useState<Message[]>(messages || []);

  // Okundu olarak işaretleme mutation'ı
  const markConversationAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/conversations/${id}/read`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to mark conversation as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["/api/conversations", id],
        (oldData: Conversation | undefined) => {
          if (!oldData) return undefined;
          return { ...oldData, isRead: true };
        }
      );

      queryClient.setQueryData(
        ["/api/conversations", id, "messages"],
        (oldData: Message[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((msg) => ({
            ...msg,
            isRead: msg.receiverId === user?.id,
          }));
        }
      );
    },
  });

  // Mesajlar değiştiğinde local state'i güncelle
  React.useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // WebSocket event handler
  React.useEffect(() => {
    const handleWebSocketMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      console.log('WebSocket mesajı alındı (conversation-detail):', data);

      // Yeni mesaj geldiğinde
      if (data.type === 'new_message' && data.conversationId === parseInt(id as string)) {
        const newMessage = data.message;

        // Local state'i güncelle
        setLocalMessages((prevMessages) => {
          const messageExists = prevMessages.some((msg: Message) => msg.id === newMessage.id);
          if (messageExists) return prevMessages;
          return [...prevMessages, newMessage];
        });

        // React Query cache'ini güncelle
        queryClient.setQueryData(
          ["/api/conversations", id, "messages"],
          (oldData: Message[] | undefined) => {
            if (!oldData) return [newMessage];
            const messageExists = oldData.some((msg: Message) => msg.id === newMessage.id);
            if (messageExists) return oldData;
            return [...oldData, newMessage];
          }
        );

        // Eğer mesajı alan bizsek okundu olarak işaretle
        if (user?.id === newMessage.receiverId) {
          markConversationAsReadMutation.mutate();
          
          // Mesaj okundu bilgisini gönder
          socket.sendMessage({
            type: 'message_read',
            conversationId: parseInt(id as string),
            messageId: newMessage.id,
            senderId: newMessage.senderId
          });
        }
        
        // Otomatik scroll
        scrollToBottom();
      }

      // Mesaj okundu bildirimi geldiğinde
      if (data.type === 'message_read' && data.conversationId === parseInt(id as string)) {
        const updateMessages = (messages: Message[]) =>
          messages.map((msg: Message) => ({
            ...msg,
            isRead: msg.senderId === user?.id ? true : msg.isRead,
          }));

        setLocalMessages((prevMessages) => updateMessages(prevMessages));

        queryClient.setQueryData(
          ["/api/conversations", id, "messages"],
          (oldData: Message[] | undefined) => {
            if (!oldData) return [];
            return updateMessages(oldData);
          }
        );
      }
      
      // Mesaj iletim durumu bildirimi geldiğinde
      if (data.type === 'message_delivery_status' && data.conversationId === parseInt(id as string)) {
        console.log('Mesaj iletim durumu:', data.status, 'Mesaj ID:', data.messageId);
        
        // Burada UI'da mesaj durumunu gösterebilirsiniz
        // Örneğin: Gönderildi, İletildi, Okundu gibi
      }
    };

    window.addEventListener("websocket-message", handleWebSocketMessage);

    // Bağlantı durumunu kontrol et ve gerekirse yeniden bağlan
    if (!socket.isConnected) {
      socket.connect().catch(error => {
        console.error('WebSocket bağlantı hatası:', error);
      });
    }
    
    // Düzenli mesaj kontrolü
    const messageCheckInterval = setInterval(() => {
      refetchMessages();
    }, 10000); // 10 saniyede bir mesajları kontrol et

    return () => {
      window.removeEventListener("websocket-message", handleWebSocketMessage);
      clearInterval(messageCheckInterval);
    };
  }, [id, queryClient, user?.id, markConversationAsReadMutation, scrollToBottom, socket, refetchMessages]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  // İlan detaylarını getir
  const { data: listing } = useQuery<Listing>({
    queryKey: ["/api/listings", conversation?.listingId],
    queryFn: async () => {
      if (!conversation?.listingId) return null;
      const response = await fetch(`/api/listings/${conversation.listingId}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
    enabled: Boolean(conversation?.listingId),
  });

  // Karşı tarafın bilgilerini almak için query
  const { data: otherUser } = useQuery({
    queryKey: ["/api/users", conversation?.senderId === user?.id ? conversation?.receiverId : conversation?.senderId],
    queryFn: async () => {
      if (!conversation) return null;
      const otherId = conversation.senderId === user?.id ? conversation.receiverId : conversation.senderId;
      const response = await fetch(`/api/conversations/${id}/user/${otherId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: Boolean(conversation),
  });

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Mesaj silinemedi.');
      }

      refetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ title: 'Hata', description: 'Mesaj silinemedi.', variant: 'destructive' });
    }
  };

  if (!user || !conversation) {
    return null;
  }

  return (
    <div className="container mx-auto px-1 py-4 md:py-8 md:px-4 min-h-[100vh] flex flex-col md:block">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              `/${referrerTab === "sent" ? "gonderilen" : "gelen"}-mesajlar`,
            )
          }
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/mesajlar/${id}/dosyalar`)}
            className="flex items-center gap-2"
          >
            <Files className="h-4 w-4" />
            Dosyalar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
              >
                <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Dosya Gönderimi</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="font-medium mb-1">Resimler (max 2MB)</h4>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, WEBP, HEIC
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Belgeler (max 20MB)</h4>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Medya (max 20MB)</h4>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, OGG, MP4, WebM
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Arşiv (max 20MB)</h4>
                    <p className="text-xs text-muted-foreground">ZIP, RAR</p>
                  </div>
                </div>
                {/* Mobil görünümde gizlilik ve bilgi uyarıları */}
                <div className="md:hidden border-t pt-2 mt-4">
                  <h4 className="font-medium mb-2">Önemli Bilgiler</h4>
                  <p className="text-xs text-muted-foreground">
                    • Kişisel veya hassas bilgilerinizi paylaşmaktan kaçının.<br />
                    • Her iki taraf da sohbetin tamamını silebilir ve bu işlem kalıcı olur.<br />
                    • Silinen mesajlar veya sohbetler hiçbir şekilde sunucuda saklanmaz.<br />
                    • Şifrelenmiş mesajlaşma kullanılarak maksimum gizlilik sağlanır<br />
                    • Mesajlar 1 yıl, resim ve dosyalar 30 gün sonra otomatik temizlenir.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="flex-1 flex flex-col md:flex-none">
        {listing && (
          <CardHeader className="border-b">
            <CardTitle>
              <a
                href={`/ilan/${listing.title.toLowerCase().replace(/\s+/g, "-")}-${listing.id}`}
                className="text-primary hover:underline flex items-center gap-2"
              >
                {listing.title}
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Mesaj listesi alanı */}
          <div className="space-y-4 flex-1 overflow-y-auto mb-20 md:mb-6">
            {localMessages?.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.senderId === user?.id
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                {/* Profil fotoğrafı ve kullanıcı adı */}
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={getProfileImageUrl(
                        message.senderId === user?.id
                          ? user.profileImage
                          : otherUser?.profileImage,
                        message.senderId === user?.id
                          ? user.gender
                          : otherUser?.gender || "unspecified",
                        message.senderId === user?.id
                          ? user.avatar
                          : otherUser?.avatar,
                      )}
                      alt="Profil"
                    />
                    <AvatarFallback>
                      {message.senderId === user?.id
                        ? user.username?.charAt(0).toUpperCase()
                        : otherUser?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {message.senderId === user?.id
                      ? user.username
                      : otherUser?.username}
                  </span>
                </div>

                {/* Mesaj baloncuğu */}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <MessageContent
                      message={message}
                      isOwnMessage={message.senderId === user?.id}
                    />
                    {/* Silme butonu */}
                    {message.senderId === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-70 hover:opacity-100 duration-200 text-gray-100 hover:text-red-400 -mt-1 -mr-2 p-1 rounded-full hover:bg-black/10"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.senderId === user?.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Mesaj gönderme formu */}
          <div className="fixed bottom-[52px] md:bottom-0 left-0 right-0 bg-background p-2 md:p-4 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:bg-transparent md:border-0 w-full max-w-full overflow-hidden z-10">
            <div className="max-w-screen-lg mx-auto">
              <MessageForm
                conversationId={parseInt(id)}
                onSuccess={refetchMessages}
              />
              {/* Gizlilik ve bilgi uyarıları - Sadece PC görünümünde */}
              <p className="hidden md:block text-xs text-muted-foreground mt-4">
                • Kişisel veya hassas bilgilerinizi paylaşmaktan kaçının.<br />
                • Her iki taraf da sohbetin tamamını silebilir ve bu işlem kalıcı olur.<br />
                • Silinen mesajlar veya sohbetler hiçbir şekilde sunucuda saklanmaz.<br />
                • Şifrelenmiş mesajlaşma kullanılarak maksimum gizlilik sağlanır<br />
                • Mesajlar 1 yıl, resim ve dosyalar 30 gün sonra otomatik temizlenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}