import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@app/components/ui/dialog";
import { Button } from "@app/components/ui/button";
import { ScrollArea } from "@app/components/ui/scroll-area";
import { getAvailableAvatars } from "@/lib/avatar";
import { useState } from "react";
import { useToast } from "@app/hooks/use-toast";

interface AvatarSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (avatarPath: string) => void;
  gender: string;
}

export function AvatarSelectorModal({
  open,
  onOpenChange,
  onSelect,
  gender
}: AvatarSelectorModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const { toast } = useToast();
  const availableAvatars = getAvailableAvatars(gender);

  // Avatar seçimini kaydetmek için API'yi çağıran fonksiyon
  const saveAvatar = async (avatarPath: string) => {
    try {
      // Avatar'ı users tablosuna kaydet
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: avatarPath }),
      });

      if (!response.ok) {
        throw new Error('Avatar güncellenemedi');
      }

      // Önce backend kaydını yap, sonra UI'ı güncelle
      onSelect(avatarPath);
      // Modal'ı kapat
      onOpenChange(false);
      // Başarı mesajı göster
      toast({
        title: "Başarılı",
        description: "Avatar güncellendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Avatar Seç</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-4">
            {availableAvatars.map((avatarPath, index) => (
              <div
                key={index}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                  selectedAvatar === avatarPath ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => setSelectedAvatar(avatarPath)}
              >
                <img
                  src={avatarPath}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-auto aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={() => {
              if (selectedAvatar) {
                // Avatar seçildiğinde doğrudan backend'e kaydet ve UI'ı güncelle
                saveAvatar(selectedAvatar);
              }
            }}
            disabled={!selectedAvatar}
          >
            Seç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}