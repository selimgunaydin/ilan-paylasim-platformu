"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@app/components/ui/button";
import { Textarea } from "@app/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, X, Image as ImageIcon, FileText, Video, Archive, File as FileIcon, Send } from "lucide-react";
import { Socket } from "socket.io-client";

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
  socket: Socket | null;
  conversationId?: number;
  receiverId: number;
  onSuccess: (content: string, files?: string[]) => void;
  listingId?: number;
  isSystemMessage?: boolean;
};

export function AdminMessageForm({
  socket,
  conversationId,
  receiverId,
  onSuccess,
  listingId,
  isSystemMessage = true, // Varsayılan olarak true
}: AdminMessageFormProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!message.trim() && selectedFiles.length === 0) return;

      if (!socket) {
        toast({
          title: "Bağlantı Hatası",
          description: "Mesaj gönderilemiyor.",
          variant: "destructive",
        });
        return;
      }

      setIsSending(true);
      try {
        let uploadedFileUrls: string[] = [];
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          if (conversationId)
            formData.append("conversationId", conversationId.toString());
          selectedFiles.forEach((file) => formData.append("files", file));

          const uploadResponse = await fetch("/api/messages/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) throw new Error("Dosya yükleme başarısız");
          const uploadResult = await uploadResponse.json();
          uploadedFileUrls = uploadResult.data.files || [];
        }

        const messageData = {
          conversationId,
          content: message.trim(),
          files: uploadedFileUrls,
          receiverId,
          listingId,
          isSystemMessage, // Sistemsel mesaj olarak işaretle
        };

        socket.emit(
          "sendMessage",
          messageData,
          (response: { success: boolean; error?: string }) => {
            if (response.success) {
              setMessage("");
              setSelectedFiles([]);
              onSuccess(message.trim(), uploadedFileUrls);
            } else {
              toast({
                title: "Hata",
                description: response.error || "Mesaj gönderilemedi",
                variant: "destructive",
              });
            }
            setIsSending(false);
          }
        );
      } catch (error) {
        console.error("Mesaj gönderme hatası:", error);
        setIsSending(false);
        toast({
          title: "Hata",
          description:
            error instanceof Error ? error.message : "Mesaj gönderilemedi",
          variant: "destructive",
        });
      }
    },
    [
      socket,
      conversationId,
      message,
      selectedFiles,
      receiverId,
      listingId,
      onSuccess,
      toast,
      isSystemMessage,
    ]
  );

  const filePreviews = useMemo(
    () =>
      selectedFiles.map((file, index) => (
        <FilePreview
          key={index}
          file={file}
          onRemove={() => handleRemoveFile(index)}
        />
      )),
    [selectedFiles, handleRemoveFile]
  );

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <div className="space-y-2">{filePreviews}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesajınız..."
            className="min-h-[40px] max-h-[100px] py-2 resize-none overflow-hidden rounded-lg"
            disabled={isSending}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(",")}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          className="shrink-0"
          disabled={
            isSending || (!message.trim() && selectedFiles.length === 0)
          }
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}