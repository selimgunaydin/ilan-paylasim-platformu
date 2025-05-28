"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@app/components/ui/button";
import { Textarea } from "@app/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    // Kullanıcı yoksa boş bir div döndür ve yönlendir
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

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles = files.filter((file) => {
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast({
            title: "Hata",
            description: `Desteklenmeyen dosya türü: ${file.name}`,
            variant: "destructive",
          });
          return false;
        }
        if (file.size > maxSize) {
          toast({
            title: "Hata",
            description: `Dosya boyutu çok büyük: ${(
              file.size /
              (1024 * 1024)
            ).toFixed(2)}MB`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    },
    [toast]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Konuşma oluştur
  const createConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          receiverId,
          listingId: listingId || null,
          isSystemMessage: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Konuşma oluşturulamadı');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Konuşma oluşturma hatası:', error);
      throw error;
    }
  }, [receiverId, listingId]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!message.trim() && selectedFiles.length === 0) {
        toast({
          title: 'Uyarı',
          description: 'Mesaj veya dosya eklemelisiniz',
          variant: 'destructive',
        });
        return;
      }

      if (!socket) {
        toast({
          title: 'Bağlantı Hatası',
          description: 'Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.',
          variant: 'destructive',
        });
        return;
      }

      setIsSending(true);
      
      try {
        // Önce konuşmayı oluştur
        const conversation = await createConversation();
        const { id: conversationId } = conversation;
        
        let uploadedFileUrls: string[] = [];
        
        // Dosya yükleme işlemi
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          formData.append('conversationId', conversationId.toString());
          selectedFiles.forEach((file) => formData.append('files', file));

          const uploadResponse = await fetch('/api/messages/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Dosya yükleme başarısız');
          }
          
          const uploadResult = await uploadResponse.json();
          uploadedFileUrls = uploadResult.data?.files || [];
        }

        // Mesaj verisini hazırla
        const messageData = {
          conversationId,
          content: message.trim(),
          files: uploadedFileUrls,
          receiverId,
          listingId: listingId || null,
          isSystemMessage: true,
        };

        // Socket üzerinden mesajı gönder
        socket.emit(
          'sendMessage',
          messageData,
          (response: { success: boolean; error?: string }) => {
            if (response.success) {
              setMessage('');
              setSelectedFiles([]);
              onSuccess();
            } else {
              throw new Error(response.error || 'Mesaj gönderilemedi');
            }
          }
        );
      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Mesaj gönderilirken bir hata oluştu',
          variant: 'destructive',
        });
      } finally {
        setIsSending(false);
      }
    },
    [message, selectedFiles, socket, receiverId, listingId, onSuccess, createConversation, toast]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <Textarea
          placeholder="Mesajınızı yazın..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px]"
          disabled={isSending}
        />
        
        {/* Dosya önizlemeleri */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => handleRemoveFile(index)}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept={ALLOWED_FILE_TYPES.join(",")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            type="submit" 
            disabled={isSending || !message.trim() && selectedFiles.length === 0}
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
      </div>
    </form>
  );
}