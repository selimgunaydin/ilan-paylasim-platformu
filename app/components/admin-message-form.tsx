"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@app/components/ui/button";
import { Textarea } from "@app/components/ui/textarea";
import { useToast } from "@app/hooks/use-toast";
import { useAuth } from "@app/hooks/use-auth";
import { Loader2, Paperclip, X, Image as ImageIcon, FileText, Video, Archive, File as FileIcon, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/providers/socket-provider";

// Sabitler
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-rar-compressed",
];

// Dosya ikonunu belirleme fonksiyonu
const getFileIcon = (file: File) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return <ImageIcon className="h-4 w-4" />;
  if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />;
  if (file.type.includes("zip") || file.type.includes("rar")) return <Archive className="h-4 w-4" />;
  if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) 
    return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};

// Dosya önizleme bileşeni
const FilePreview = React.memo<{ file: File; onRemove: () => void }>(
  ({ file, onRemove }) => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    return (
      <div className="flex items-center justify-between bg-muted p-2 rounded-md">
        <div className="flex items-center gap-2">
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="h-8 w-8 object-cover rounded"
            />
          ) : (
            getFileIcon(file)
          )}
          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive/90"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
FilePreview.displayName = "FilePreview";

type AdminMessageFormProps = {
  receiverId: number;
  onSuccess: () => void;
  listingId?: number;
};

export function AdminMessageForm({
  receiverId,
  onSuccess,
  listingId,
}: AdminMessageFormProps): JSX.Element {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!user) {
    if (typeof window !== 'undefined') {
      toast({
        title: "Hata",
        description: "Oturum açmanız gerekiyor",
        variant: "destructive",
      });
      router.push("/giris");
    }
    return <div />;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!socket) {
      toast({
        title: 'Hata',
        description: 'Soket bağlantısı mevcut değil.',
        variant: 'destructive',
      });
      return;
    }

    if (message.trim() === '') {
      toast({
        title: 'Hata',
        description: 'Lütfen bir mesaj yazın.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    const payload = {
      receiverId,
      listingId, 
      content: message.trim(),
    };

    socket.emit(
      'sendAdminMessage',
      payload,
      (response: { success: boolean; error?: string }) => {
        setIsSending(false);
        if (response.success) {
          setMessage('');
          onSuccess();
          toast({
            title: 'Başarılı',
            description: 'Mesajınız başarıyla gönderildi.',
            variant: 'success',
          });
        } else {
          toast({
            title: 'Hata',
            description: response.error || 'Mesaj gönderilemedi',
            variant: 'destructive',
          });
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <Textarea
          placeholder="Kullanıcıya bir mesaj gönderin..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px]"
          disabled={isSending}
        />
      </div>
      
      <div className="flex justify-end items-center">
        <Button 
          type="submit" 
          disabled={isSending || !message.trim()}
          className="ml-auto"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Gönder
            </>
          )}
        </Button>
      </div>
    </form>
  );
}