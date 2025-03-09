import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@app/components/ui/button";
import { Card, CardContent } from "@app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Message, Conversation } from "@/types";
import {
  ArrowLeft,
  PaperclipIcon,
  Send,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Music,
  Video as VideoIcon,
  Archive,
  Files,
  ListChecks,
  Star,
  MessageSquare,
  User,
  Info,
  Maximize2,
  Check, // Okundu bildirimi için eklendi
} from "lucide-react";
import { Textarea } from "@app/components/ui/textarea";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@app/components/ui/dialog";

const getFileIcon = (fileName: string) => {
  const ext = fileName.toLowerCase().split(".").pop();
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext || "")) {
    return <ImageIcon className="h-5 w-5" />;
  }
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(
      ext || "",
    )
  ) {
    return <FileText className="h-5 w-5" />;
  }
  if (["mp3", "wav", "ogg"].includes(ext || "")) {
    return <Music className="h-5 w-5" />;
  }
  if (["mp4", "webm"].includes(ext || "")) {
    return <VideoIcon className="h-5 w-5" />;
  }
  if (["zip", "rar"].includes(ext || "")) {
    return <Archive className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
};

const MediaPlayer = ({ src, type, fileName }: { src: string; type: "video" | "audio"; fileName: string }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const toggleFullScreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Tam ekran hatası:`, err);
      });
    }
  };

  if (type === "video") {
    return (
      <div className="relative group w-full">
        <video
          ref={videoRef}
          src={src}
          className="w-full rounded-lg"
          controls
          playsInline
          preload="metadata"
          style={{ maxWidth: '100%' }}
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
      preload="metadata"
    />
  );
};


export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [message, setMessage] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const firstRender = React.useRef(true);
  const endRef = React.useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useAutoScroll(endRef);

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", id],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        router.push("/dashboard");
        toast({
          title: "Hata",
          description: "Bu konuşmaya erişim yetkiniz yok.",
          variant: "destructive",
        });
        throw new Error("Yetkisiz erişim");
      }
      return response.json();
    },
    retry: false,
    enabled: Boolean(user) && Boolean(id),
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>(
    {
      queryKey: ["/api/conversations", id, "messages"],
      queryFn: async () => {
        const response = await fetch(`/api/conversations/${id}/messages`);
        if (!response.ok) throw new Error("Mesajlar yüklenemedi");
        return response.json();
      },
      enabled: Boolean(user) && Boolean(id) && Boolean(conversation),
      refetchInterval: 30000, // 30 saniyede bir otomatik yenileme
    },
  );

  const markMessagesAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/conversations/${id}/read`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Mesajlar okundu olarak işaretlenemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      // Yerel durumu güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations", "received"] });
    },
    onError: (error) => {
      console.error("Mesaj okundu işaretleme hatası:", error);
      toast({
        title: "Hata",
        description: "Mesajlar okundu olarak işaretlenemedi",
        variant: "destructive"
      });
    }
  });

  React.useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsReadMutation.mutate();
    }
  }, [messages, markMessagesAsReadMutation]);

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      // Önce kullanıcıya sor
      const confirmed = window.confirm("Bu mesajı silmek istediğinizden emin misiniz?");
      if (!confirmed) {
        return null;
      }

      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Mesaj silinemedi");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data) { // null değilse (kullanıcı onayladıysa)
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", id, "messages"] });
        toast({
          title: "Mesaj silindi",
          description: "Mesaj başarıyla silindi",
        });
      }
    },
    onError: (error) => {
      console.error("Mesaj silme hatası:", error);
      toast({
        title: "Hata",
        description: "Mesaj silinemedi",
        variant: "destructive"
      });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; files?: FileList }) => {
      const formData = new FormData();
      formData.append("message", data.content);
      formData.append("conversationId", id);
      if (data.files) {
        for (let i = 0; i < data.files.length; i++) {
          formData.append("files", data.files[i]);
        }
      }
      const res = await fetch(`/api/messages`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Mesaj gönderilemedi");
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      console.error("Mesaj gönderme hatası:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !message.trim() &&
      (!fileInputRef.current?.files || fileInputRef.current.files.length === 0)
    ) {
      return;
    }
    setUploading(true);
    try {
      await sendMessageMutation.mutateAsync({
        content: message,
        files: fileInputRef.current?.files || undefined,
      });
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    deleteMessageMutation.mutate(messageId);
  };

  // Mesajlar yüklendiğinde otomatik scroll
  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Düzenli mesaj kontrolü
  React.useEffect(() => {
    const messageCheckInterval = setInterval(() => {
      refetchMessages();
    }, 10000); // 10 saniyede bir mesajları kontrol et

    return () => {
      clearInterval(messageCheckInterval);
    };
  }, [refetchMessages]);

  // Render
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Mesajlaşma</h1>
            {conversation && (
              <p className="text-sm text-gray-500">
                {conversation.listingTitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] ${
                msg.senderId === user?.id
                  ? "bg-blue-500 text-white rounded-tl-lg rounded-tr-sm rounded-bl-lg"
                  : "bg-gray-200 text-gray-800 rounded-tl-sm rounded-tr-lg rounded-br-lg"
              } p-3 shadow-sm relative group`}
            >
              {/* Mesaj içeriği */}
              {msg.content && (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              )}

              {/* Dosyalar */}
              {msg.files && msg.files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.files.map((file, index) => {
                    const fileName = file.split("/").pop() || "dosya";
                    const fileUrl = file;
                    const fileType = fileName.split(".").pop()?.toLowerCase();
                    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
                      fileType || ""
                    );
                    const isVideo = ["mp4", "webm", "mov"].includes(fileType || "");
                    const isAudio = ["mp3", "wav", "ogg"].includes(fileType || "");

                    if (isImage) {
                      return (
                        <Dialog key={index}>
                          <DialogTrigger asChild>
                            <div className="cursor-pointer">
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="max-h-48 rounded-md object-contain"
                              />
                              <div className="text-xs mt-1 flex items-center">
                                {getFileIcon(fileName)}
                                <span className="ml-1 truncate max-w-[200px]">
                                  {fileName}
                                </span>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{fileName}</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center">
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="max-h-[80vh] object-contain"
                              />
                            </div>
                            <div className="flex justify-end mt-4">
                              <a
                                href={fileUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center"
                              >
                                <Files className="h-4 w-4 mr-1" />
                                İndir
                              </a>
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    } else if (isVideo) {
                      return (
                        <Dialog key={index}>
                          <DialogTrigger asChild>
                            <div className="cursor-pointer">
                              <div className="bg-gray-100 rounded-md p-2 flex items-center">
                                <VideoIcon className="h-5 w-5 mr-2 text-blue-500" />
                                <span className="truncate max-w-[200px]">
                                  {fileName}
                                </span>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{fileName}</DialogTitle>
                            </DialogHeader>
                            <MediaPlayer
                              src={fileUrl}
                              type="video"
                              fileName={fileName}
                            />
                            <div className="flex justify-end mt-4">
                              <a
                                href={fileUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center"
                              >
                                <Files className="h-4 w-4 mr-1" />
                                İndir
                              </a>
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    } else if (isAudio) {
                      return (
                        <div key={index} className="mt-2">
                          <div className="bg-gray-100 rounded-md p-2">
                            <div className="flex items-center mb-1">
                              <Music className="h-5 w-5 mr-2 text-blue-500" />
                              <span className="truncate max-w-[200px]">
                                {fileName}
                              </span>
                            </div>
                            <MediaPlayer
                              src={fileUrl}
                              type="audio"
                              fileName={fileName}
                            />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <a
                          key={index}
                          href={fileUrl}
                          download={fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="bg-gray-100 rounded-md p-2 flex items-center">
                            {getFileIcon(fileName)}
                            <span className="ml-2 truncate max-w-[200px]">
                              {fileName}
                            </span>
                          </div>
                        </a>
                      );
                    }
                  })}
                </div>
              )}

              {/* Zaman ve durum */}
              <div
                className={`text-xs mt-1 flex justify-between items-center ${
                  msg.senderId === user?.id
                    ? "text-blue-100"
                    : "text-gray-500"
                }`}
              >
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.senderId === user?.id && (
                  <span className="flex items-center ml-2">
                    {msg.isRead ? (
                      <Check className="h-3 w-3 ml-1" />
                    ) : (
                      <Check className="h-3 w-3 ml-1" />
                    )}
                  </span>
                )}
              </div>

              {/* Silme butonu */}
              {msg.senderId === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteMessage(msg.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="min-h-[60px] resize-none"
              disabled={uploading}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <div className="flex items-center mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <PaperclipIcon className="h-5 w-5 mr-1" />
                Dosya Ekle
              </Button>
              {fileInputRef.current?.files?.length ? (
                <span className="text-xs text-gray-500 ml-2">
                  {fileInputRef.current.files.length} dosya seçildi
                </span>
              ) : null}
            </div>
          </div>
          <Button
            type="submit"
            disabled={
              uploading ||
              (!message.trim() &&
                (!fileInputRef.current?.files ||
                  fileInputRef.current.files.length === 0))
            }
            className="h-10"
          >
            {uploading ? "Gönderiliyor..." : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}