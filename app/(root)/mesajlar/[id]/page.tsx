'use client'

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/providers/socket-provider';
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
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

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

// Enhanced Media Preview Components
const MediaPreview = ({ fileUrl, fileName, type }: { fileUrl: string; fileName: string; type: 'image' | 'video' | 'audio' }) => {
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  return (
    <div className="relative rounded-lg overflow-hidden">
      {type === 'image' ? (
        <>
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsFullScreen(true)}
          />
          {isFullScreen && (
            <FullScreenPreview
              fileUrl={fileUrl}
              fileName={fileName}
              onClose={() => setIsFullScreen(false)}
            />
          )}
        </>
      ) : type === 'video' ? (
        <video
          src={fileUrl}
          className="w-full h-40 object-cover"
          controls
          controlsList="nodownload"
        />
      ) : (
        <audio
          src={fileUrl}
          className="w-full"
          controls
          controlsList="nodownload"
        />
      )}
    </div>
  );
};

const FullScreenPreview = ({ fileUrl, fileName, onClose }: any) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose?.();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-label={`Full screen preview: ${fileName}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close full screen preview"
      >
        <X className="h-6 w-6" />
      </Button>
      <img
        src={fileUrl}
        alt={fileName}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
        loading="lazy"
      />
    </div>
  );
};

const FileAttachment = ({ fileUrl, fileName }: { fileUrl: string; fileName: string }) => {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {getFileIcon(fileName)}
      <span className="text-sm text-blue-500 truncate">{fileName}</span>
    </a>
  );
};

// Refactored MessageContent Component
const MessageContent = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const renderContentWithLinks = () => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    const urls = message.content.match(urlRegex) || [];

    return parts.map((part, index) => {
      if (!part) return null;
      const url = urls[index - 1];
      if (url) {
        return (
          <a
            key={`url-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {url}
          </a>
        );
      }
      return <span key={`text-${index}`}>{part}</span>;
    });
  };

  return (
    <div className="space-y-2">
      {message.content && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderContentWithLinks()}
        </p>
      )}
      {message.files && message.files.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {message.files.map((file, index) => {
            const fileName = file.split('/').pop() || 'file';
            const fileType = getFileType(fileName);

            return (
              <div key={index} className="w-full">
                {fileType === 'image' ? (
                  <MediaPreview
                    fileUrl={file}
                    fileName={fileName}
                    type={fileType}
                  />
                ) : fileType === 'video' || fileType === 'audio' ? (
                  <MediaPreview
                    fileUrl={file}
                    fileName={fileName}
                    type={fileType}
                  />
                ) : (
                  <FileAttachment
                    fileUrl={file}
                    fileName={fileName}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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


export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const prevScrollHeightRef = useRef<number>(0);
  const isInitialMount = useRef(true);
  const headerRef = useRef<HTMLDivElement>(null);
  // Infinite Query for Messages with Pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/conversations', id, 'messages'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/conversations/${id}/messages?page=${pageParam}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return {
        messages: result.messages,
        nextPage: result.hasMore ? pageParam + 1 : undefined,
        listingId: result.listingId,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: Boolean(user) && Boolean(id),
    initialPageParam: 0,
  });
  const { data: otherUser } = useQuery({
    queryKey: ['/api/users', data?.pages[0]?.messages[0]?.senderId === user?.id ? data?.pages[0]?.messages[0]?.receiverId : data?.pages[0]?.messages[0]?.senderId],
    queryFn: async () => {
      if (!data?.pages[0]?.messages[0]) return null;
      const otherId = data?.pages[0]?.messages[0]?.senderId === user?.id ? data?.pages[0]?.messages[0]?.receiverId : data?.pages[0]?.messages[0]?.senderId;
      const response = await fetch(`/api/conversations/${id}/user/${otherId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: Boolean(data?.pages[0]?.messages[0]),
  });

  const { data: listing } = useQuery<Listing>({
    queryKey: ['/api/listings', data?.pages[0]?.listingId],
    queryFn: async () => {
      if (!data?.pages[0]?.listingId) return null;
      const response = await fetch(`/api/listings/${data?.pages[0]?.listingId}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      return response.json();
    },
    enabled: Boolean(data?.pages[0]?.listingId),
  });

  // Flatten messages from pages
  const allMessages = React.useMemo(() => {
    const messages = data?.pages.flatMap(page => page.messages) || [];
    return [...messages, ...localMessages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [data, localMessages]);

  useEffect(() => {
    document.querySelector('footer')?.classList.add('hidden');

    return () => {
      document.querySelector('footer')?.classList.remove('hidden');
    };
  }, []);

  // Scroll to Bottom Function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const tryScroll = (attempts = 3) => {
      if (!messagesEndRef.current) return;

      messagesEndRef.current.scrollIntoView({ behavior });
      
      // Verify scroll position and retry if needed
      setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight > 100 && attempts > 0) {
          tryScroll(attempts - 1);
        }
      }, 100);
    };
    tryScroll();
  }, []);

  // Check if scrolled to bottom
  const handleScroll = useCallback(
    debounce(() => {
      if (!scrollContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const bottomThreshold = 100;
      const isBottom = scrollHeight - scrollTop - clientHeight < bottomThreshold;
      setIsAtBottom(isBottom);

      // Load more messages when near top
      if (scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
        prevScrollHeightRef.current = scrollHeight;
        fetchNextPage();
      }
    }, 100),
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Initial Scroll and Socket Setup
  useEffect(() => {
    if (isInitialMount.current && allMessages.length > 0) {
      scrollToBottom('auto');
      isInitialMount.current = false;
    }
    
    if (!socket || !id) return;

    socket.emit('joinConversation', id);

    socket.on('messageNotification', (message: any) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === message.message.id)) return prev;
        const newMessages = [...prev, message.message].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        if (isAtBottom) {
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
        return newMessages;
      });
      socket.emit('markAsRead', id);
    });

    allMessages.forEach((message) => {
      if (message.receiverId === user?.id && !message.isRead) {
        socket.emit('markAsRead', id);
      }
    });

    socket.on('messageRead', ({ conversationId }) => {
      if (conversationId === id) {
        setLocalMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }
    });

    return () => {
      socket.off('messageNotification');
      socket.off('messageRead');
      socket.emit('leaveConversation', id);
    };
  }, [socket, id, isAtBottom, scrollToBottom, allMessages, user]);

  // Scroll to bottom when sending new message
  const handleMessageSuccess = useCallback((content: string, files?: string[]) => {
    const newMessage = {
      id: Date.now(),
      senderId: user!.id,
      receiverId: data?.pages[0]?.messages[0]?.senderId === user!.id 
        ? data?.pages[0]?.messages[0]?.receiverId 
        : data?.pages[0]?.messages[0]?.senderId,
      content,
      files: files || [],
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    
    setLocalMessages((prev) => {
      const newMessages = [...prev, newMessage].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      if (isAtBottom) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
      return newMessages;
    });
  }, [user, data, scrollToBottom, isAtBottom]);

  useEffect(() => {
    if (isFetchingNextPage || !scrollContainerRef.current) return;
    
    const currentScrollHeight = scrollContainerRef.current.scrollHeight;
    if (prevScrollHeightRef.current && prevScrollHeightRef.current < currentScrollHeight) {
      const heightDiff = currentScrollHeight - prevScrollHeightRef.current;
      scrollContainerRef.current.scrollTop += heightDiff;
    }
  }, [isFetchingNextPage, allMessages]);

  function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Mesaj silinemedi.');
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      toast({ title: 'Hata', description: 'Mesaj silinemedi.', variant: 'destructive' });
    }
  };

  if (!user || !data) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-white">
      <div ref={headerRef} className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
          <AvatarImage
              src={getProfileImageUrl(otherUser?.profileImage, otherUser?.gender || 'unspecified', otherUser?.avatar)}
              alt="Profil"
            />
            <AvatarFallback>{otherUser?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{otherUser?.username}</p>
            {listing && (
              <a
                href={`/ilan/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                {listing?.title}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Messages with Custom Scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        onScroll={handleScroll}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        )}
        
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto opacity-50" />
              <p className="text-sm">Start the conversation</p>
            </div>
          </div>
        ) : (
          allMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'} group`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-3 transition-all relative ${
                  message.senderId === user.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <MessageContent 
                  message={message} 
                  isOwnMessage={message.senderId === user.id} 
                />
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs opacity-75">
                    {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.senderId === user.id && (
                    <span className="flex items-center">
                      {message.isRead ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
                {message.senderId === user.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white h-6 w-6 p-0 rounded-full"
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {!isAtBottom && allMessages.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-20 right-4 rounded-full h-10 w-10 p-0 shadow-md"
          onClick={() => scrollToBottom('smooth')}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}

      {/* Message Input */}
      <div className="sticky bottom-0 z-10 bg-white border-t p-4">
        <MessageForm
          socket={socket}
          conversationId={parseInt(id)}
          receiverId={data?.pages[0]?.messages[0]?.senderId === user.id ? data?.pages[0]?.messages[0]?.receiverId : data?.pages[0]?.messages[0]?.senderId}
          onSuccess={handleMessageSuccess}
        />
      </div>
    </div>
  );
}