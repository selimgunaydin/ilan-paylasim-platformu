import React from "react";
import { CardContent } from "../ui/card";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Conversation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getProfileImageUrl } from "@/lib/avatar";

interface ConversationCardProps {
  conversation: Conversation;
  deleteMutation: any;
  type: "sent" | "received";
  onCardClick?: (id: number) => void;
  isSelected?: boolean;
  className?: string;
}

export default function ConversationCard({
  conversation,
  deleteMutation,
  type,
  onCardClick,
  isSelected,
  className,
}: ConversationCardProps) {
  const router = useRouter();

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days === 0) {
      if (hours < 1) return "Az önce";
      if (hours < 24) return `${hours} saat önce`;
      return "Bugün";
    }
    if (days === 1) return "Dün";
    if (days < 7) return `${days} gün önce`;
    if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
    return `${Math.floor(days / 30)} ay önce`;
  };

  // Link'e tıklandığında ve onCardClick prop'u varsa çağır
  const handleClick = () => {
    if (onCardClick) {
      onCardClick(conversation.id);
    }
  };

  return (
    <Card
      key={conversation.id}
      className={`hover:bg-accent/50 transition-colors relative ${
        isSelected ? "bg-accent/50" : ""
      } ${className}`}
    >
      {/* Tüm kart tıklanabilir yapıldı */}

      {conversation?.unreadCount > 0 && (
        <div className="absolute -top-2 -right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
          {conversation.unreadCount} Yeni
        </div>
      )}

      <div className="cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Sol taraf - Profil ve kullanıcı bilgileri */}
            <div
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={handleClick}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={getProfileImageUrl(
                    conversation[type === "sent" ? "receiver" : "sender"]
                      ?.profileImage,
                    conversation[type === "sent" ? "receiver" : "sender"]
                      ?.gender || "unspecified",
                    conversation[type === "sent" ? "receiver" : "sender"]
                      ?.avatar
                  )}
                  alt={
                    conversation[type === "sent" ? "receiver" : "sender"]
                      ?.username
                  }
                />
                <AvatarFallback>
                  {conversation[
                    type === "sent" ? "receiver" : "sender"
                  ]?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {
                    conversation[type === "sent" ? "receiver" : "sender"]
                      ?.username
                  }
                </p>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {conversation.listingTitle}
                </p>
              </div>
            </div>

            {/* Sağ taraf - Tarih ve silme butonu */}
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatRelativeDate(new Date(conversation.createdAt))}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 -mr-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konuşmayı Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem
                      geri alınamaz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteMutation.mutate(conversation.id);
                      }}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
