import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@app/hooks/use-auth";
import { Button } from "@app/components/ui/button";
import { Card, CardContent } from "@app/components/ui/card";
import { useToast } from "@app/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Image,
  File,
  Music,
  Video,
  Archive,
} from "lucide-react";
import { FileGroup } from "@/types";
import Link from "next/link";

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension || "")) {
    return <Image className="h-5 w-5" />;
  }
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(
      extension || "",
    )
  ) {
    return <FileText className="h-5 w-5" />;
  }
  if (["mp3", "wav", "ogg"].includes(extension || "")) {
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

export default function ConversationFiles() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    data: files = [],
    isLoading,
    error,
  } = useQuery<FileGroup[]>({
    queryKey: ["/api/messages/conversation", id, "files"],
    queryFn: async () => {
      const response = await fetch(`/api/messages/conversation/${id}/files`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Dosyalar yüklenirken bir hata oluştu" }));
        throw new Error(
          errorData.error || "Dosyalar yüklenirken bir hata oluştu",
        );
      }
      return response.json();
    },
    enabled: Boolean(user) && Boolean(id),
  });

  React.useEffect(() => {
    if (!user) {
      router.push("/dashboard");
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişmek için giriş yapmanız gerekiyor.",
        variant: "destructive",
      });
    }
  }, [user, router, toast]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/mesajlar/${id}`}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Sohbete Dön
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Dosya Timeline</h2>

          {isLoading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error instanceof Error
                ? error.message
                : "Dosyalar yüklenirken bir hata oluştu"}
            </div>
          ) : !files || files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Bu sohbette henüz dosya paylaşılmamış
            </div>
          ) : (
            <div className="space-y-8">
              {files.map((fileGroup) => (
                <div
                  key={fileGroup.messageId}
                  className="relative pl-4 border-l-2 border-primary"
                >
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary"></div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {new Date(fileGroup.createdAt).toLocaleString("tr-TR")}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      {getFileIcon(fileGroup.fileKey)}
                      <a
                        href={`${process.env.NEXT_PUBLIC_MESSAGE_BUCKET_URL}/${fileGroup.fileKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex-1 break-all"
                      >
                        {fileGroup.fileKey.split("/").pop()}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
