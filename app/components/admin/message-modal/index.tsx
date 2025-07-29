"use client";

import { useState, useEffect } from "react";
import { X, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@app/components/ui/button";
import { Textarea } from "@app/components/ui/textarea";
import { Label } from "@app/components/ui/label";
import { useToast } from "@app/hooks/use-toast";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  username: string;
}

export function MessageModal({ isOpen, onClose, userId, username }: MessageModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) {
      toast({
        title: "Hata",
        description: "Lütfen bir mesaj yazın veya dosya seçin",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      // Önce dosyayı yükle
      let fileUrl = "";
      if (selectedFile) {
        const formData = new FormData();
        formData.append("files", selectedFile);
        
        const uploadResponse = await fetch("/api/messages/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) throw new Error("Dosya yükleme başarısız");
        const uploadResult = await uploadResponse.json();
        fileUrl = uploadResult.data.files?.[0] || "";
      }

      // Mesajı gönder
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          receiverId: userId,
          content: message,
          file: fileUrl,
          isSystemMessage: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Mesaj gönderilemedi");
      }

      toast({
        title: "Başarılı",
        description: `Mesaj ${username} kullanıcısına gönderildi`,
      });
      
      setMessage("");
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Mesaj gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {username} Kullanıcısına Mesaj Gönder
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
            disabled={isSending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mesajınız</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              rows={4}
              disabled={isSending}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="flex items-center gap-2 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>{selectedFile ? selectedFile.name : "Dosya Ekle (Opsiyonel)"}</span>
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSending}
              />
            </Label>
            
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-destructive hover:underline"
                  disabled={isSending}
                >
                  Kaldır
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSending || (!message && !selectedFile)}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Gönder"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}