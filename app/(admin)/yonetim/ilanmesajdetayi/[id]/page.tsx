'use client'

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types";
import {
  ArrowLeft,
  FileText,
  Image,
  File,
  Music,
  Video,
  Archive,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@app/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/avatar";

// Dosya tipine göre ikon döndüren yardımcı fonksiyon
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || "")) {
    return <Image className="h-5 w-5" />;
  }
  if (["pdf", "doc", "docx", "txt"].includes(extension || "")) {
    return <FileText className="h-5 w-5" />;
  }
  if (["mp3", "wav"].includes(extension || "")) {
    return <Music className="h-5 w-5" />;
  }
  if (["mp4", "webm"].includes(extension || "")) {
    return <Video className="h-5 w-5" />;
  }
  if (["zip", "rar"].includes(extension || "")) {
    return <Archive className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
};

export default function AdminConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const router = useRouter();

  // Admin yetkisi kontrolü
  const { data: adminUser, isError: isAdminError } = useQuery({
    queryKey: ["/api/admin/user"],
    queryFn: async () => {
      const response = await fetch("/api/admin/user");
      if (!response.ok) {
        router.push("/yonetim");
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya erişim yetkiniz yok.",
          variant: "destructive",
        });
        throw new Error("Unauthorized");
      }
      return response.json();
    },
    retry: false,
  });

  // Konuşma mesajlarını getir
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/admin/conversations", id, "messages"],
    queryFn: async () => {
      console.log("Fetching messages for conversation:", id);
      const response = await fetch(`/api/admin/conversations/${id}/messages`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Mesajlar alınamadı");
      }
      const data = await response.json();
      console.log("Retrieved messages:", data);
      return data.messages || [];
    },
    enabled: Boolean(adminUser) && !isAdminError && Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Yetkisiz erişim</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/yonetim/tummesajlar")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Mesajlar</h3>
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <Card key={message.id}>
              <CardContent className="p-1">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage
                      src={getProfileImageUrl(
                        message.sender?.profileImage,
                        message.sender?.gender || "unspecified",
                        message.sender?.avatar,
                      )}
                      alt={message.sender?.username}
                    />
                    <AvatarFallback>
                      {message.sender?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium">{message.sender?.username}</p>
                      <span className="text-sm text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.files && message.files.length > 0 && (
                      <div className="mt-3 space-y-2 bg-muted p-1 rounded-md">
                        {message.files.map((file, index) => {
                          const fileName = file.split("/").pop() || file;
                          const fileUrl = `https://message-images.ilandaddy.com/messages/${fileName}`;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              {getFileIcon(fileName)}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {fileName}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">
            Bu konuşmada henüz mesaj bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );
}
