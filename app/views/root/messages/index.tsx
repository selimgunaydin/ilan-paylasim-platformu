"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket-provider";
import { Button } from "@app/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageForm } from "@app/components/message-form";
import { Listing } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@app/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/avatar";
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
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
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
} from "@/components/ui/alert-dialog";
import { getMessageFileUrClient } from "@/utils/get-message-file-url";
import { useSession } from "next-auth/react";

// File type helpers
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || ""))
    return <Image className="h-5 w-5" />;
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(
      extension || ""
    )
  )
    return <FileText className="h-5 w-5" />;
  if (["mp3", "wav", "ogg", "m4a"].includes(extension || ""))
    return <Music className="h-5 w-5" />;
  if (["mp4", "webm", "mov", "m4v"].includes(extension || ""))
    return <Video className="h-5 w-5" />;
  if (["zip", "rar"].includes(extension || ""))
    return <Archive className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
};

const getFileType = (
  fileName: string
): "image" | "video" | "audio" | "other" => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || ""))
    return "image";
  if (["mp4", "webm", "mov", "m4v"].includes(extension || "")) return "video";
  if (["mp3", "wav", "ogg", "m4a"].includes(extension || "")) return "audio";
  return "other";
};

// Media Preview Components
const MediaPreview = ({
  fileUrl,
  fileName,
  type,
}: {
  fileUrl: string;
  fileName: string;
  type: "image" | "video" | "audio";
}) => {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const fullUrl = fileUrl.startsWith("http")
    ? fileUrl
    : getMessageFileUrClient(fileUrl);

  return (
    <div className="relative rounded-lg">
      {type === "image" ? (
        <>
          <img
            src={fullUrl}
            alt={fileName}
            className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsFullScreen(true)}
          />
          {isFullScreen && (
            <FullScreenPreview
              fileUrl={fullUrl}
              fileName={fileName}
              onClose={() => setIsFullScreen(false)}
            />
          )}
        </>
      ) : type === "video" ? (
        <video
          src={fullUrl}
          className="w-full h-40 object-cover"
          controls
          controlsList="nodownload"
        />
      ) : (
        <audio
          src={fullUrl}
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
    if (e.key === "Escape") onClose?.();
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

const FileAttachment = ({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
}) => {
  const fullUrl = fileUrl.startsWith("http")
    ? fileUrl
    : getMessageFileUrClient(fileUrl);

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {getFileIcon(fileName)}
      <span className="text-sm text-blue-500 truncate">{fileName}</span>
    </a>
  );
};

const MessageContent = ({
  message,
  isOwnMessage,
}: {
  message: Message;
  isOwnMessage: boolean;
}) => {
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
            const fileName = file.split("/").pop() || "file";
            const fileType = getFileType(fileName);

            return (
              <div key={index} className="w-full">
                {fileType === "image" ? (
                  <MediaPreview
                    fileUrl={file}
                    fileName={fileName}
                    type={fileType}
                  />
                ) : fileType === "video" || fileType === "audio" ? (
                  <MediaPreview
                    fileUrl={file}
                    fileName={fileName}
                    type={fileType}
                  />
                ) : (
                  <FileAttachment fileUrl={file} fileName={fileName} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SkeletonWrapper = () => {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-start gap-3 justify-start">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="max-w-[70%] rounded-2xl p-3 bg-gray-100">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
              <div className="flex items-center justify-end gap-2">
                <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-3 bg-gray-200 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
      {[1, 2].map((item) => (
        <div key={`own-${item}`} className="flex items-start gap-3 justify-end">
          <div className="max-w-[70%] rounded-2xl p-3 bg-blue-100">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-blue-200 animate-pulse rounded" />
              <div className="h-4 w-48 bg-blue-200 animate-pulse rounded" />
              <div className="flex items-center justify-end gap-2">
                <div className="h-3 w-12 bg-blue-200 animate-pulse rounded" />
                <div className="h-3 w-3 bg-blue-200 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Type Definitions
type Message = {
  id: number;
  content: string;
  files?: string[];
  createdAt: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
};

type ConversationDirection = "sent" | "received";

export default function MessagesView({
  conversationId: id,
  type,
}: {
  conversationId: string;
  type: ConversationDirection;
}) {
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
  const { data: session } = useSession();

  const currentUserId = Number(session?.user?.id);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["/api/conversations", id, "messages"],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await fetch(
          `/api/conversations/${id}/messages?page=${pageParam}&limit=20`
        );
        if (!response.ok) throw new Error("Failed to fetch messages");
        const result = await response.json();
        return {
          messages: result.messages,
          nextPage: result.hasMore ? pageParam + 1 : undefined,
          listingId: result.listingId,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextPage,
      enabled: Boolean(session) && Boolean(id),
      initialPageParam: 0,
    });

  const otherUserId = React.useMemo(() => {
    const firstMessage = data?.pages[0]?.messages[0];
    if (!firstMessage) return null;
    return type === "sent" ? firstMessage.receiverId : firstMessage.senderId;
  }, [data, type]);

  const { data: otherUser } = useQuery({
    queryKey: ["/api/users", otherUserId],
    queryFn: async () => {
      if (!otherUserId) return null;
      const response = await fetch(
        `/api/conversations/${id}/user/${otherUserId}`
      );
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: Boolean(otherUserId),
  });

  const { data: listing } = useQuery<Listing>({
    queryKey: ["/api/listings", data?.pages[0]?.listingId],
    queryFn: async () => {
      if (!data?.pages[0]?.listingId) return null;
      const response = await fetch(
        `/api/listings/${data?.pages[0]?.listingId}`
      );
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
    enabled: Boolean(data?.pages[0]?.listingId),
  });

  const allMessages = React.useMemo(() => {
    const messages = data?.pages.flatMap((page) => page.messages) || [];
    return [...messages, ...localMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [data, localMessages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const tryScroll = (attempts = 3) => {
      if (!messagesEndRef.current) return;

      messagesEndRef.current.scrollIntoView({
        behavior,
        block: "end",
        inline: "nearest",
      });

      setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight > 100 && attempts > 0) {
          tryScroll(attempts - 1);
        }
      }, 100);
    };
    tryScroll();
  }, []);

  const handleScroll = useCallback(
    debounce(() => {
      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const bottomThreshold = 100;
      const isBottom =
        scrollHeight - scrollTop - clientHeight < bottomThreshold;
      setIsAtBottom(isBottom);

      if (scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
        prevScrollHeightRef.current = scrollHeight;
        fetchNextPage();
      }
    }, 100),
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    if (isInitialMount.current && allMessages.length > 0) {
      scrollToBottom("auto");
      isInitialMount.current = false;
    }
  }, [allMessages.length, scrollToBottom]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("joinConversation", id);

    return () => {
      socket.emit("leaveConversation", id);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleMessageNotification = (message: any) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === message.message.id)) return prev;
        const newMessages = [...prev, message.message].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        if (isAtBottom) {
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
        return newMessages;
      });
      socket.emit("markAsRead", id);
    };

    const handleMessageRead = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      if (conversationId === id) {
        setLocalMessages((prev) =>
          prev.map((msg) => ({ ...msg, isRead: true }))
        );
      }
    };

    socket.on("messageNotification", handleMessageNotification);
    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("messageNotification", handleMessageNotification);
      socket.off("messageRead", handleMessageRead);
    };
  }, [socket, id, isAtBottom, scrollToBottom]);

  useEffect(() => {
    if (!socket || !id || !currentUserId || !allMessages.length) return;

    const unreadMessageIds = new Set<number>();

    allMessages.forEach((message) => {
      const isOwnMessage = message.senderId === currentUserId;
      const shouldMarkRead =
        type === "received" && !isOwnMessage && !message.isRead;

      if (shouldMarkRead && !unreadMessageIds.has(message.id)) {
        unreadMessageIds.add(message.id);
      }
    });

    if (unreadMessageIds.size > 0) {
      socket.emit("markAsRead", id);
    }
  }, [socket, id, currentUserId, allMessages, type]);

  const handleMessageSuccess = useCallback(
    (content: string, files?: string[]) => {
      const newMessage = {
        id: Date.now(),
        senderId: currentUserId,
        receiverId: otherUserId,
        content,
        files: files || [],
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setLocalMessages((prev) => {
        const newMessages = [...prev, newMessage].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        if (isAtBottom) {
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
        return newMessages;
      });
    },
    [currentUserId, otherUserId, scrollToBottom, isAtBottom]
  );

  useEffect(() => {
    if (isFetchingNextPage || !scrollContainerRef.current) return;

    const currentScrollHeight = scrollContainerRef.current.scrollHeight;
    if (
      prevScrollHeightRef.current &&
      prevScrollHeightRef.current < currentScrollHeight
    ) {
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
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Mesaj silinemedi.");
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      toast({
        title: "Hata",
        description: "Mesaj silinemedi.",
        variant: "destructive",
      });
    }
  };

  if (!session?.user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white md:container mx-auto">
      <div
        ref={headerRef}
        className="sticky z-10 bg-white border-b px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getProfileImageUrl(
                otherUser?.profileImage,
                otherUser?.gender || "unspecified",
                otherUser?.avatar
              )}
              alt="Profil"
            />
            <AvatarFallback>{otherUser?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {otherUser?.username || "Yükleniyor..."}
            </p>
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

      <div
        ref={scrollContainerRef}
        className="flex-1 mb-16 md:mb-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        onScroll={handleScroll}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        )}

        {isLoading ? (
          <SkeletonWrapper />
        ) : allMessages.length === 0 ? (
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
              className={`flex ${
                message.senderId === currentUserId
                  ? "justify-end"
                  : "justify-start"
              } group`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-3 transition-all relative ${
                  message.senderId === currentUserId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <MessageContent
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                />
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs opacity-75">
                    {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {message.senderId === currentUserId && (
                    <span className="flex items-center">
                      {message.isRead ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
                {message.senderId === currentUserId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white h-6 w-6 p-0 rounded-full"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mesajı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu mesajı silmek istediğinizden emin misiniz? Bu işlem
                          geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMessage(message.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isAtBottom && allMessages.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-20 right-4 rounded-full h-10 w-10 p-0 shadow-md"
          onClick={() => scrollToBottom("smooth")}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}

      <div className="sticky bottom-[70px] md:bottom-0 z-10 bg-white border-t p-4">
        <MessageForm
          socket={socket}
          conversationId={parseInt(id)}
          listingId={data?.pages[0]?.listingId}
          receiverId={otherUserId}
          onSuccess={handleMessageSuccess}
        />
      </div>
    </div>
  );
}
