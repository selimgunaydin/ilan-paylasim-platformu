'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@app/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageForm } from '@app/components/message-form';
import { Listing } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@app/components/ui/avatar';
import { getProfileImageUrl } from '@/lib/avatar';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import {
  ArrowLeft,
  ChevronDown,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  MessageSquare,
  Files,
  Info,
  Maximize2,
  Download,
  FileText,
  Image,
  File,
  Music,
  Video,
  Archive,
  X,
} from 'lucide-react';
import { Socket, io } from 'socket.io-client';

// ... (Önceki yardımcı bileşenler aynı kalıyor: getFileIcon, getFileType, ImageViewer, MediaPlayer, MessageContent)
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

// User tipi için ek alan
type UserWithToken = {
  id: number;
  username: string;
  email: string;
  token?: string;
  [key: string]: any; // Diğer alanlar için
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
  const referrerTab = searchParams.get('tab') || 'received';
  const endRef = React.useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useAutoScroll(endRef);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = React.useState(true);
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const [socket, setSocket] = React.useState<Socket | null>(null);

  // Socket.IO bağlantısını kurma
  React.useEffect(() => {
    if (!user) return;

    // user nesnesini UserWithToken tipine dönüştür
    const userWithToken = user as unknown as UserWithToken;
    const token = userWithToken.token;
    
    if (!token) {
      console.error("Oturum token'ı bulunamadı!");
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama bilgisi eksik. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      });
      return;
    }

    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket'],
      auth: { token }, // Token'ı auth içinde gönderiyoruz
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu:', socketInstance.id);
      socketInstance.emit('authenticate', token);
      socketInstance.emit('joinConversation', id);
    });

    socketInstance.on('newMessage', (message: Message) => {
      console.log('Yeni mesaj alındı:', message);
      setLocalMessages((prev) => {
        // Mesaj zaten varsa ekleme
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        // Yeni mesajı ekle ve tarihe göre sırala
        return [...prev, message].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      scrollToBottomIfNeeded();
    });

    socketInstance.on('messageRead', ({ conversationId }) => {
      if (conversationId === id) {
        setLocalMessages((prev) =>
          prev.map((msg) => ({ ...msg, isRead: true }))
        );
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Bağlantı hatası:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [id, user]);

  // İlk mesajları yükleme
  const { data: initialMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/conversations', id, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      if (data.some((msg: Message) => msg.receiverId === user?.id && !msg.isRead)) {
        socket?.emit('markAsRead', id);
      }
      return data;
    },
    enabled: Boolean(user) && Boolean(id)
  });

  // initialMessages değiştiğinde localMessages'ı güncelle
  React.useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setLocalMessages(initialMessages.sort((a: Message, b: Message) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    }
  }, [initialMessages]);

  // Konuşma detayları
  const { data: conversation } = useQuery<Conversation>({
    queryKey: ['/api/conversations', id],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        router.push('/dashboard');
        toast({
          title: 'Yetkisiz Erişim',
          description: 'Bu konuşmaya erişim yetkiniz yok.',
          variant: 'destructive',
        });
        throw new Error('Unauthorized');
      }
      return response.json();
    },
    retry: false,
    enabled: Boolean(user),
  });

  // İlan detayları
  const { data: listing } = useQuery<Listing>({
    queryKey: ['/api/listings', conversation?.listingId],
    queryFn: async () => {
      if (!conversation?.listingId) return null;
      const response = await fetch(`/api/listings/${conversation.listingId}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      return response.json();
    },
    enabled: Boolean(conversation?.listingId),
  });

  // Karşı tarafın bilgileri
  const { data: otherUser } = useQuery({
    queryKey: ['/api/users', conversation?.senderId === user?.id ? conversation?.receiverId : conversation?.senderId],
    queryFn: async () => {
      if (!conversation) return null;
      const otherId = conversation.senderId === user?.id ? conversation.receiverId : conversation.senderId;
      const response = await fetch(`/api/conversations/${id}/user/${otherId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: Boolean(conversation),
  });

  // Scroll kontrolü
  const scrollToBottomIfNeeded = React.useCallback(() => {
    if (isScrolledToBottom) {
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [isScrolledToBottom, scrollToBottom]);

  React.useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setScrollPosition(scrollTop);
      setIsScrolledToBottom(scrollHeight - scrollTop - clientHeight < 20);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Mesaj gönderme
  const handleSendMessage = (content: string, files?: string[]) => {
    if (!socket || !conversation) return;

    socket.emit('sendMessage', {
      conversationId: id,
      content,
      files,
      receiverId: conversation.senderId === user?.id ? conversation.receiverId : conversation.senderId,
    });
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Mesaj silinemedi.');
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      toast({ title: 'Hata', description: 'Mesaj silinemedi.', variant: 'destructive' });
    }
  };

  if (!user || !conversation) return null;

  return (
    <div className="container mx-auto px-1 py-4 md:py-8 md:px-4 min-h-[100vh] flex flex-col md:block">
      {/* ... (UI kısmı aynı kalıyor, sadece MessageForm'u güncelliyoruz) */}
      <Card className="flex-1 flex flex-col md:flex-none">
        {listing && (
          <CardHeader className="border-b">
            <CardTitle>
              <a
                href={`/ilan/${listing.title.toLowerCase().replace(/\s+/g, '-')}-${listing.id}`}
                className="text-primary hover:underline flex items-center gap-2"
              >
                {listing.title}
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-4 flex-1 flex flex-col">
          <div
            ref={messagesContainerRef}
            className="space-y-4 flex-1 overflow-y-auto mb-20 md:mb-6 px-1 md:px-2 scroll-smooth"
          >
            {localMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Henüz mesaj yok. Konuşmayı başlatmak için bir mesaj gönderin.</p>
                </div>
              </div>
            ) : (
              localMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${message.senderId === user?.id ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-200`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getProfileImageUrl(
                          message.senderId === user?.id ? user.profileImage : otherUser?.profileImage,
                          message.senderId === user?.id ? user.gender : otherUser?.gender || 'unspecified',
                          message.senderId === user?.id ? user.avatar : otherUser?.avatar,
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
                      {message.senderId === user?.id ? user.username : otherUser?.username}
                    </span>
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 group hover:shadow-md transition-shadow duration-200 ${
                      message.senderId === user?.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <MessageContent message={message} isOwnMessage={message.senderId === user?.id} />
                      {message.senderId === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-100 hover:text-red-400 -mt-1 -mr-2 p-1 rounded-full hover:bg-black/10"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div
                      className={`text-xs mt-2 flex items-center gap-1 ${
                        message.senderId === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString('tr-TR')}
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
  socket={socket}
  conversationId={parseInt(id)}
  receiverId={conversation.senderId === user?.id ? conversation.receiverId : conversation.senderId}
  onSuccess={(content, files) => {
    // Yeni mesajı localMessages'a ekle
    const newMessage = {
      id: Date.now(), // Geçici ID
      senderId: user?.id,
      receiverId: conversation.senderId === user?.id ? conversation.receiverId : conversation.senderId,
      content,
      files: files || [],
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setLocalMessages(prev => [...prev, newMessage].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ));
    scrollToBottom();
  }}
/>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}