"use client";

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
  Image as ImageIcon,
  File,
  Music,
  Video,
  Archive,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@app/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/avatar";
import Link from "next/link";
import { getMessageFileUrClient } from "@/utils/get-message-file-url";

// Helper function to return file icons based on extension
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const iconClass = "h-5 w-5 text-muted-foreground";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || ""))
    return <ImageIcon className={iconClass} />;
  if (["pdf", "doc", "docx", "txt"].includes(extension || ""))
    return <FileText className={iconClass} />;
  if (["mp3", "wav"].includes(extension || ""))
    return <Music className={iconClass} />;
  if (["mp4", "webm"].includes(extension || ""))
    return <Video className={iconClass} />;
  if (["zip", "rar"].includes(extension || ""))
    return <Archive className={iconClass} />;
  return <File className={iconClass} />;
};

export default function AdminConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const router = useRouter();

  // Check admin authorization
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

  // Fetch conversation messages
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/conversations", id, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/conversations/${id}/messages`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Mesajlar alınamadı");
      }
      const data = await response.json();
      return data || [];
    },
    enabled: Boolean(adminUser) && !isAdminError && Boolean(id),
  });

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link
          href="/yonetim/tummesajlar"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Tüm Mesajlara Geri Dön</span>
        </Link>
      </header>

      {/* Messages Section */}
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Konuşma Detayları
        </h1>
        {data.messages.length > 0 ? (
          <div className="space-y-4">
            {data.messages.map((message: any) => {
              const isSender = data.sender.id === message.senderId;
              const profileImage = isSender ? data.receiver.profileImage : data.sender.profileImage;
              const username = isSender ? data.receiver.username : data.sender.username;
              const gender = isSender ? data.receiver.gender : data.sender.gender;
              const avatar = isSender ? data.receiver.avatar : data.sender.avatar;
              return (
                <Card
                  key={message.id}
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={getProfileImageUrl(
                            profileImage,
                            gender || "unspecified",
                            avatar
                          )}
                          alt={username}
                        />
                        <AvatarFallback>
                          {username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">
                            {username}
                          </p>
                          <span className="text-sm text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString("tr-TR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {message.content}
                        </p>
                        {message.files && message.files.length > 0 && (
                          <div className="mt-3 space-y-2 rounded-lg bg-muted p-3">
                            {message.files.map((file: any, index: any) => {
                              const fileName = file.split("/").pop() || file;
                              const fileUrl = file.startsWith("http")
                                ? file
                                : getMessageFileUrClient(file);
                              return (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 hover:bg-muted-foreground/10 p-1 rounded-md transition-colors"
                                >
                                  {getFileIcon(fileName)}
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline truncate max-w-xs"
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
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-muted-foreground text-lg">
              Bu konuşmada henüz mesaj bulunmuyor.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}