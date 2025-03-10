'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@app/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageForm } from '@app/components/message-form';
import { Listing } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@app/components/ui/avatar';
import { getProfileImageUrl } from '@/lib/avatar';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  MessageSquare,
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

// Yardımcı Bileşenler
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(extension || '')) return <Image className="h-5 w-5" />;
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension || '')) return <FileText className="h-5 w-5" />;
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return <Music className="h-5 w-5" />;
  if (['mp4', 'webm', 'mov', 'm4v'].includes(extension || '')) return <Video className="h-5 w-5" />;
  if (['zip', 'rar'].includes(extension || '')) return <Archive className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
};

const getFileType = (fileName: string): 'image' | 'video' | 'audio' | 'other' => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(extension || '')) return 'image';
  if (['mp4', 'webm', 'mov', 'm4v'].includes(extension || '')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
  return 'other';
};

const ImageViewer = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={onClose}>
    <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={onClose}>
      <X className="h-6 w-6" />
    </Button>
    <img src={src} alt="Full size" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
  </div>
);

const MediaPlayer = ({ src, type, fileName }: { src: string; type: 'video' | 'audio'; fileName: string }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const toggleFullScreen = () => {
    if (!videoRef.current) return;
    document.fullscreenElement ? document.exitFullscreen() : videoRef.current.requestFullscreen();
  };

  if (type === 'video') {
    return (
      <div className="relative group">
        <video ref={videoRef} src={src} className="max-w-full rounded-lg" controls controlsList="nodownload" preload="metadata" />
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
  return <audio src={src} className="w-full" controls controlsList="nodownload" preload="metadata" />;
};

// Tip Tanımları
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
  isRead: boolean;
};

type UserWithToken = {
  id: number;
  username: string;
  email: string;
  token?: string;
  profileImage?: string;
  gender?: string;
  avatar?: string;
  [key: string]: any;
};

// Mesaj İçeriği Bileşeni
const MessageContent = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const renderMessageContent = () => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    const urls = message.content.match(urlRegex) || [];
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) result.push(<span key={`text-${i}`}>{parts[i]}</span>);
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
      {message.files && message.files.length > 0 && (
        <div className="mt-2 space-y-2">
          {message.files.map((file, index) => {
            const fileType = getFileType(file);
            const fileName = file.split('/').pop() || 'dosya';
            return (
              <div key={index} className="rounded-md overflow-hidden border bg-background/80">
                {fileType === 'image' ? (
                  <div className="relative group">
                    <img
                      src={file}
                      alt={fileName}
                      className="max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(file, '_blank')}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" onClick={() => window.open(file, '_blank')}>
                        <Maximize2 className="h-4 w-4 mr-1" /> Görüntüle
                      </Button>
                    </div>
                  </div>
                ) : fileType === 'video' || fileType === 'audio' ? (
                  <MediaPlayer src={file} type={fileType} fileName={fileName} />
                ) : (
                  <div className="p-3 flex items-center gap-2">
                    {getFileIcon(fileName)}
                    <a href={file} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex-1 truncate">
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
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const [socket, setSocket] = React.useState<Socket | null>(null);

  // Socket.IO Bağlantısı
  React.useEffect(() => {
    if (!user) return;
    const userWithToken = user as UserWithToken;
    const token = userWithToken.token;
    if (!token) {
      toast({ title: 'Bağlantı Hatası', description: 'Kimlik doğrulama bilgisi eksik.', variant: 'destructive' });
      return;
    }

    const socketInstance = io('http://localhost:3001', { transports: ['websocket'], auth: { token } });
    socketInstance.on('connect', () => {
      socketInstance.emit('authenticate', token);
      socketInstance.emit('joinConversation', id);
    });

    socketInstance.on('messageNotification', (message: any) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === message.message.id)) return prev;
        return [...prev, message.message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });

    socketInstance.on('messageRead', ({ conversationId }) => {
      if (conversationId === id) {
        setLocalMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Bağlantı hatası:', err.message);
    });

    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, [id, user, toast]);

  // İlk Mesajları Yükleme
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
    enabled: Boolean(user) && Boolean(id),
  });

  React.useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setLocalMessages(initialMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }
  }, [initialMessages]);

  // Konuşma Detayları
  const { data: conversation } = useQuery<Conversation>({
    queryKey: ['/api/conversations', id],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        router.push('/dashboard');
        toast({ title: 'Yetkisiz Erişim', description: 'Bu konuşmaya erişim yetkiniz yok.', variant: 'destructive' });
        throw new Error('Unauthorized');
      }
      return response.json();
    },
    retry: false,
    enabled: Boolean(user),
  });

  // İlan Detayları
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

  // Karşı Tarafın Bilgileri
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

  // Mesaj Gönderme
  const handleSendMessage = (content: string, files?: string[]) => {
    if (!socket || !conversation || !user) return;
    socket.emit('sendMessage', {
      conversationId: id,
      content,
      files,
      receiverId: conversation.senderId === user.id ? conversation.receiverId : conversation.senderId,
    });
  };

  // Mesaj Silme
  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Mesaj silinemedi.');
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      toast({ title: 'Hata', description: 'Mesaj silinemedi.', variant: 'destructive' });
    }
  };

  if (!user || !conversation) return null;

  return (
    <div className="flex flex-col bg-gray-100 relative">
      {/* Sabit Üst Başlık (WhatsApp Tarzı) */}
      <div className="absolute top-0 left-0 right-0 bg-gray-700 text-white p-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getProfileImageUrl(otherUser?.profileImage, otherUser?.gender || 'unspecified', otherUser?.avatar)}
              alt="Profil"
            />
            <AvatarFallback>{otherUser?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{otherUser?.username || 'Kullanıcı'}</h2>
            {listing && (
              <p className="text-xs opacity-75">
                İlan:{' '}
                <a href={`/ilan/${listing.title.toLowerCase().replace(/\s+/g, '-')}-${listing.id}`} className="underline">
                  {listing.title}
                </a>
              </p>
            )}
          </div>
        </div>
        {listing && (
          <a
            href={`/ilan/${listing.title.toLowerCase().replace(/\s+/g, '-')}-${listing.id}`}
            className="text-white hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Mesaj Alanı (Kaydırılabilir) */}
      <div
        className="flex-1 overflow-y-auto pt-20 pb-20 bg-repeat"
      >
        <div className="px-4 py-2 space-y-2">
          {localMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Henüz mesaj yok. Konuşmayı başlatmak için bir mesaj gönderin.</p>
              </div>
            </div>
          ) : (
            localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow-md relative ${
                    message.senderId === user.id
                      ? 'bg-gray-200 text-black rounded-br-none'
                      : 'bg-white text-black rounded-bl-none'
                  }`}
                >
                  <MessageContent message={message} isOwnMessage={message.senderId === user.id} />
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                    {new Date(message.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    {message.senderId === user.id && (
                      <span>
                        {message.isRead ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-500" />
                        )}
                      </span>
                    )}
                  </div>
                  {message.senderId === user.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity text-red-500"
                      onClick={() => handleDeleteMessage(message.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Sabit Mesaj Giriş Alanı */}
      <div className="absolute bottom-0 left-0 right-0 bg-white p-2 shadow-md z-10">
        <div className="max-w-screen-lg mx-auto">
          <MessageForm
            socket={socket}
            conversationId={parseInt(id)}
            receiverId={conversation.senderId === user.id ? conversation.receiverId : conversation.senderId}
            onSuccess={(content, files) => {
              const newMessage = {
                id: Date.now(),
                senderId: user.id,
                receiverId: conversation.senderId === user.id ? conversation.receiverId : conversation.senderId,
                content,
                files: files || [],
                createdAt: new Date().toISOString(),
                isRead: false,
              };
              setLocalMessages((prev) =>
                [...prev, newMessage].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}