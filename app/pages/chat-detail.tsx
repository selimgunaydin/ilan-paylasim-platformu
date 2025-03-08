import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@app/components/ui/button";
import { Card, CardContent } from "@app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
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
  const socket = useWebSocket();
  const firstRender = React.useRef(true);

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
    onSuccess: (data) => {
      // WebSocket üzerinden mesaj okundu bildirimi gönder
      if (socket) {
        socket.send(JSON.stringify({
          type: "message_read",
          conversationId: parseInt(id),
          messages: data.updatedMessages
        }));
      }

      // Yerel durumu güncelle
      queryClient.invalidateQueries(["/api/conversations", id, "messages"]);
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
        queryClient.invalidateQueries(["/api/conversations", id, "messages"]);
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

  React.useEffect(() => {
    if (!socket) return;

    const handleWebSocketMessage = (event: CustomEvent) => {
      try {
        const data = event.detail;
        console.log("WebSocket mesajı alındı:", data);
        if (
          data.type === "new_message" &&
          data.conversationId === parseInt(id)
        ) {
          queryClient.invalidateQueries({
            queryKey: ["/api/conversations", id, "messages"],
          });
          markMessagesAsReadMutation.mutate();
        }
        if (
          data.type === "message_deleted" &&
          data.conversationId === parseInt(id)
        ) {
          queryClient.invalidateQueries({
            queryKey: ["/api/conversations", id, "messages"],
          });
        }
      } catch (error) {
        console.error("WebSocket mesaj işleme hatası:", error);
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener);

    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener);
    };
  }, [socket, id, queryClient, markMessagesAsReadMutation]);

  React.useEffect(() => {
    if (firstRender.current) {
      const textarea = document.getElementById("point");
      if (textarea) {
        textarea.scrollIntoView({ behavior: "auto" });
      }
      firstRender.current = false;
    }
  }, []);

  const { endRef } = useAutoScroll([messages]);

  const searchParams = new URLSearchParams(window.location.search);
  const referrerTab = searchParams.get("tab") || "received";

  if (!user || !conversation) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${referrerTab === "sent" ? "gonderilen" : "gelen"}-mesajlar`)}
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
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WEBP, HEIC</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Belgeler (max 20MB)</h4>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Medya (max 20MB)</h4>
                      <p className="text-xs text-muted-foreground">MP3, WAV, OGG, MP4, WebM</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Arşiv (max 20MB)</h4>
                      <p className="text-xs text-muted-foreground">ZIP, RAR</p>
                    </div>
                  </div>
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
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 mb-6 max-h-[calc(100vh-250px)] md:max-h-[60vh] overflow-y-auto scroll-smooth">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-1 ${
                    message.senderId === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="break-words whitespace-pre-wrap">
                        {message.content}{" "}
                      </p>
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.files.map((file, index) => {
                            const fileName = file.split("/").pop() || file;
                            const fileType = fileName.split(".").pop()?.toLowerCase();
                            const isVideo = ["mp4", "webm"].includes(fileType || "");
                            const src = `https://message-images.ilandaddy.com/${file}`;

                            return (
                              <div key={index} className="flex items-center gap-2">
                                {getFileIcon(fileName)}
                                {isVideo ? (
                                  <MediaPlayer src={src} type="video" fileName={fileName} />
                                ) : (
                                  <a
                                    href={src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm hover:underline ${
                                      message.senderId === user?.id
                                        ? "text-primary-foreground/90 hover:text-primary-foreground"
                                        : "text-foreground/90 hover:text-foreground"
                                    }`}
                                  >
                                    {fileName}
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {message.senderId === user?.id && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs opacity-70">
                          {message.isRead ? (
                            <div className="flex">
                              <Check className="h-3 w-3" />
                              <Check className="h-3 w-3 -ml-2" />
                            </div>
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`opacity-0 hover:opacity-100 transition-opacity -mt-1 -mr-2 ${
                            message.senderId === user?.id
                              ? "text-primary-foreground/60 hover:text-primary-foreground/90"
                              : ""
                          }`}
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            <div className="h-4">
              <div ref={endRef} className="h-px" />
            </div>
          </div>

          <form
            onSubmit={handleSendMessage}
            className="fixed md:relative bottom-[52px] md:bottom-auto left-0 md:left-auto right-0 md:right-auto bg-white md:bg-transparent p-4 md:p-0 border-t md:border-0 w-full md:w-auto"
          >
            <div className="flex items-center gap-2 max-w-screen-lg mx-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon className="h-5 w-5" />
              </Button>
              <span id="point"></span>
              <div className="flex-1 relative">
                <Textarea
                  id="messageTextarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesajınız..."
                  className="min-h-[40px] max-h-[100px] py-2 resize-none overflow-hidden rounded-[25px] border-2 border-[#d5d5d5] !important focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const totalSize = Array.from(e.target.files).reduce(
                        (acc, file) => acc + file.size,
                        0,
                      );
                      if (totalSize > 20 * 1024 * 1024) {
                        toast({
                          title: "Hata",
                          description: "Toplam dosya boyutu 20MB'ı geçemez",
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }
                    }
                  }}
                />
              </div>

              <Button
                type="submit"
                size="sm"
                className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
                disabled={
                  (!message.trim() &&
                    (!fileInputRef.current?.files ||
                      fileInputRef.current.files.length === 0)) ||
                  uploading
                }
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="hidden md:block text-xs text-muted-foreground mt-4">
              • Kişisel veya hassas bilgilerinizi paylaşmaktan kaçının.<br />
              • Her iki taraf da sohbetin tamamını silebilir ve bu işlem kalıcı olur.<br />
              • Silinen mesajlar veya sohbetler hiçbir şekilde sunucuda saklanmaz.<br />
              • Şifrelenmiş mesajlaşma kullanılarak maksimum gizlilik sağlanır<br />
              • Mesajlar 1 yıl, resim ve dosyalar 30 gün sonra otomatik temizlenir.
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex items-center justify-between w-full">
          <Link href="/ilanlarim" className="flex-1 min-w-0">
            <div className="flex flex-col items-center py-1.5 px-0.5">
              <ListChecks className="h-4 w-4" />
              <span className="text-[10px] truncate mt-0.5">İlanlarım</span>
            </div>
          </Link>
          <Link href="/favorilerim" className="flex-1 min-w-0">
            <div className="flex flex-col items-center py-1.5 px-0.5">
              <Star className="h-4 w-4" />
              <span className="text-[10px] truncate mt-0.5">Favorilerim</span>
            </div>
          </Link>
          <Link href="/gonderilen" className="flex-1 min-w-0">
            <div className="flex flex-col items-center py-1.5 px-0.5">
              <Send className="h-4 w-4" />
              <span className="text-[10px] truncate mt-0.5">Gönderilen</span>
            </div>
          </Link>
          <Link href="/gelen" className="flex-1 min-w-0">
            <div className="flex flex-col items-center py-1.5 px-0.5">
              <MessageSquare className="h-4 w-4" />
              <span className="text-[10px] truncate mt-0.5">Gelen</span>
            </div>
          </Link>
          <Link href="/profilim" className="flex-1 min-w-0">
            <div className="flex flex-col items-center py-1.5 px-0.5">
              <User className="h-4 w-4" />
              <span className="text-[10px] truncate mt-0.5">Profilim</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}