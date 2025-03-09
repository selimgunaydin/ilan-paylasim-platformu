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
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ExternalLink,
  Trash2,
  Check,
  CheckCheck,
  FileText,
  Image,
  File,
  Music,
  Video,
  Archive,
  Files,
  Info,
  X,
  Maximize2,
  ChevronDown,
  Download,
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
  // Mesaj içeriğini URL'leri bağlantıya dönüştürerek göster
  const renderMessageContent = () => {
    // URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Mesaj içeriğini parçalara ayır
    const parts = message.content.split(urlRegex);
    
    // URL'leri bul
    const urls = message.content.match(urlRegex) || [];
    
    // Parçaları ve URL'leri birleştir
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        // Normal metin
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }
      
      // URL varsa ekle
      if (urls[i - 1]) {
        result.push(
          <a 
            key={`url-${i-1}`} 
            href={urls[i - 1]} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`underline ${isOwnMessage ? 'text-blue-200' : 'text-blue-500'}`}
          >
            {urls[i - 1]}
          </a>
        );
      }
    }
    
    return result;
  };

  return (
    <div className="break-words">
      <div className="whitespace-pre-wrap">{renderMessageContent()}</div>
      
      {/* Dosya ekleri */}
      {message.files && message.files.length > 0 && (
        <div className="mt-2 space-y-2">
          {message.files.map((file, index) => {
            const fileType = getFileType(file);
            const fileName = file.split("/").pop() || "dosya";
            
            return (
              <div key={index} className="rounded-md overflow-hidden border bg-background/80">
                {fileType === "image" ? (
                  <div className="relative group">
                    <img
                      src={file}
                      alt={fileName}
                      className="max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(file, "_blank")}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" onClick={() => window.open(file, "_blank")}>
                        <Maximize2 className="h-4 w-4 mr-1" /> Görüntüle
                      </Button>
                    </div>
                  </div>
                ) : fileType === "video" || fileType === "audio" ? (
                  <MediaPlayer src={file} type={fileType} fileName={fileName} />
                ) : (
                  <div className="p-3 flex items-center gap-2">
                    {getFileIcon(fileName)}
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex-1 truncate"
                    >
                      {fileName}
                    </a>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file} download={fileName}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
  const endRef = React.useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useAutoScroll(endRef);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Scroll pozisyonunu kaydet
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = React.useState(true);

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
    if (!messages || messages.length === 0) return;
    
    // Mesajları tarih sırasına göre sırala (eskiden yeniye)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setLocalMessages(sortedMessages);
  }, [messages]);

  // Scroll olayını dinle - Objenin kendisine değil, current değerine bakarak optimizasyon
  React.useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Sadece scroll pozisyonu değiştiğinde state'i güncelle
      if (scrollTop !== scrollPosition) {
        setScrollPosition(scrollTop);
      }
      
      // En alta yakın mı kontrol et (20px tolerans)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
      
      // Sadece değişiklik varsa state'i güncelle (gereksiz render'ları önlemek için)
      if (isAtBottom !== isScrolledToBottom) {
        setIsScrolledToBottom(isAtBottom);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []); // Sadece mount/unmount'ta çalıştır

  // Hem mesajlar yüklendiğinde hem de yeni mesaj geldiğinde scroll işlemleri için tek fonksiyon
  const scrollToBottomIfNeeded = React.useCallback(() => {
    // Eğer kullanıcı zaten aşağıdaysa veya mesajlar ilk kez yükleniyorsa scroll yap
    if (isScrolledToBottom || localMessages.length <= messages.length) {
      setTimeout(() => {
        scrollToBottom();
      }, 50); // Daha kısa gecikme yeterli
    }
  }, [isScrolledToBottom, localMessages.length, messages.length, scrollToBottom]);

  // Mesajlar değiştiğinde scroll kontrolü yap
  React.useEffect(() => {
    if (localMessages.length > 0) {
      scrollToBottomIfNeeded();
    }
  }, [localMessages.length, scrollToBottomIfNeeded]);

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
          <div 
            ref={messagesContainerRef}
            className="space-y-4 flex-1 overflow-y-auto mb-20 md:mb-6 px-1 md:px-2 scroll-smooth"
          >
            {localMessages?.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Henüz mesaj yok. Konuşmayı başlatmak için bir mesaj gönderin.</p>
                </div>
              </div>
            ) : (
              localMessages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    message.senderId === user?.id
                      ? "flex-row-reverse"
                      : "flex-row"
                  } animate-in fade-in duration-200`}
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
                    className={`max-w-[70%] rounded-lg p-3 group hover:shadow-md transition-shadow duration-200 ${
                      message.senderId === user?.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted shadow-sm"
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
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200 text-gray-100 hover:text-red-400 -mt-1 -mr-2 p-1 rounded-full hover:bg-black/10"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div
                      className={`text-xs mt-2 flex items-center gap-1 ${
                        message.senderId === user?.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString("tr-TR")}
                      {message.senderId === user?.id && (
                        <span className="ml-1">
                          {message.isRead ? (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Mesaj gönderme formu */}
          <div className="fixed bottom-[52px] md:bottom-0 left-0 right-0 bg-background p-2 md:p-4 border-t md:relative md:bottom-auto md:left-auto md:right-auto md:bg-transparent md:border-0 w-full max-w-full overflow-hidden z-10 shadow-md md:shadow-none">
            <div className="max-w-screen-lg mx-auto">
              {!isScrolledToBottom && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-[80px] right-4 rounded-full p-2 shadow-md bg-background z-20"
                  onClick={scrollToBottom}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              <MessageForm
                conversationId={parseInt(id)}
                onSuccess={() => {
                  refetchMessages();
                  scrollToBottom();
                }}
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