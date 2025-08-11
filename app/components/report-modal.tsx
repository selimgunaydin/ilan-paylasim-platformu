"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useToast } from "@app/hooks/use-toast";

// Şikayet nedenleri
const LISTING_REPORT_REASONS = [
  "Spam veya tekrarlanan içerik",
  "Yanıltıcı veya sahte bilgi",
  "Uygunsuz içerik",
  "Telif hakkı ihlali",
  "Dolandırıcılık şüphesi",
  "Kategori uyumsuzluğu",
  "Diğer"
];

const MESSAGE_REPORT_REASONS = [
  "Spam mesaj",
  "Taciz veya rahatsız edici davranış",
  "Uygunsuz dil kullanımı",
  "Dolandırıcılık girişimi",
  "Tehdit veya zorbalık",
  "Cinsel içerikli mesaj",
  "Diğer"
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "listing" | "message";
  contentId: number;
  reportedUserId: number;
  contentTitle?: string; // İlan başlığı veya mesaj önizlemesi
}

export function ReportModal({
  isOpen,
  onClose,
  reportType,
  contentId,
  reportedUserId,
  contentTitle
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reasons = reportType === "listing" ? LISTING_REPORT_REASONS : MESSAGE_REPORT_REASONS;
  const title = reportType === "listing" ? "İlanı Şikayet Et" : "Mesajı Şikayet Et";
  const description = reportType === "listing" 
    ? "Bu ilanı neden şikayet etmek istiyorsunuz?" 
    : "Bu mesajı neden şikayet etmek istiyorsunuz?";

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({ title: "Şikayet nedeni gerekli", description: "Devam etmek için bir neden seçin.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          contentId,
          reportedUserId,
          reason: selectedReason,
        }),
      });

      if (response.ok) {
        toast({ title: "Şikayet alındı", description: "Değerlendirme ekibimiz en kısa sürede inceleyecek.", variant: "success" });
        onClose();
        setSelectedReason("");
      } else {
        const error = await response.json();
        toast({ title: "Şikayet gönderilemedi", description: error.message || "Şikayet gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Report submission error:", error);
      toast({ title: "Bağlantı hatası", description: "Şikayet gönderilemedi. İnternet bağlantınızı kontrol edin ve tekrar deneyin.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {contentTitle && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                {reportType === "listing" ? "İlan:" : "Mesaj:"}
              </p>
              <p className="text-sm font-medium truncate">{contentTitle}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-700 mb-3">{description}</p>
            
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Gönderiliyor..." : "Şikayet Et"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
