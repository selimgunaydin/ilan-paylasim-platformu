"use client";

import { useMutation } from "@tanstack/react-query";
import { MessageForm } from "@app/components/message-form";
import { Button } from "@app/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, StarOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useCallback, useState } from "react";
import { Modal } from "@app/components/ui/modal";
import { useSocket } from "@/providers/socket-provider";
import { ImageGallery } from "@app/components/image-gallery";

type User = {
  id: string;
};

type Listing = {
  id: number;
  title: string;
  description: string;
  images: string[];
  userId: number;
  categoryId: string;
  listingType: string;
  city: string;
  contactPerson?: string;
  phone?: string;
  views?: number;
  createdAt?: string;
  categoryName?: string;
};

type Props = {
  listing: Listing;
  user: User | null;
  initialFavoriteStatus: boolean;
  slug: string;
};

export default function ListingDetailClient({
  listing,
  user,
  initialFavoriteStatus,
  slug,
}: Props) {
  const { toast } = useToast();
  const { socket } = useSocket();
  const id = slug.split("-").pop()!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialFavoriteStatus);

  const addToFavorites = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      if (!res.ok) throw new Error("Favorilere eklenemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", id] });
      setIsFavorite(true);
      toast({ title: "Başarılı", description: "İlan favorilere eklendi" });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan favorilere eklenemedi",
        variant: "destructive",
      });
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Favorilerden çıkarılamadı");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", id] });
      setIsFavorite(false);
      toast({ title: "Başarılı", description: "İlan favorilerden çıkarıldı" });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan favorilerden çıkarılamadı",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = () => {
    if (!user) {
      toast({
        title: "Uyarı",
        description: "Favorilere eklemek için giriş yapmalısınız",
        variant: "destructive",
      });
      return;
    }
    if (listing.userId == Number(user.id)) {
      toast({
        title: "Uyarı",
        description: "Kendi ilanınızı favorilere ekleyemezsiniz",
        variant: "destructive",
      });
      return;
    }
    if (isFavorite) {
      removeFromFavorites.mutate();
    } else {
      addToFavorites.mutate();
    }
  };

  const handleMessageSuccess = useCallback(
    (content: string, files?: string[]) => {
      const newMessage = {
        id: Date.now(),
        senderId: user!.id,
        receiverId: listing?.userId,
        files: files || [],
        createdAt: new Date().toISOString(),
        isRead: false,
      };
    },
    [user, listing]
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Image Gallery */}
      {listing.images && listing.images.length > 0 && (
        <div className="mb-6 md:col-span-2">
          <ImageGallery 
            images={listing.images} 
            title={listing.title} 
            categoryName={listing.categoryName} 
          />
        </div>
      )}

      {/* Favorite Button */}
      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={toggleFavorite}
          disabled={addToFavorites.isPending || removeFromFavorites.isPending}
        >
          {isFavorite ? (
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="h-5 w-5" />
          )}
          {isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        </Button>
      </div>

      {/* Message Form */}
      <div className="mt-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">İlan Sahibine Mesaj Gönder</h3>
        {!user ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
            <p>
              Mesaj göndermek için{" "}
              <a href="/auth" className="text-blue-600 hover:underline">
                giriş
              </a>{" "}
              yapmalısınız.
            </p>
          </div>
        ) : listing.userId && Number(user.id) != listing.userId ? (
          <>
          {listing.userId && Number(user.id) != listing.userId && (
            <MessageForm
              socket={socket}
              receiverId={listing.userId}
              onSuccess={handleMessageSuccess}
              listingId={listing.id}
            />
            )}
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Mesaj Güvenliği Hakkında Daha Fazla Bilgi
              </Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => setIsModalOpen(false)}
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Mesajlaşırken Uyulması Gereken Kurallar</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    <li>Karşılıklı saygı çerçevesinde iletişim kurun.</li>
                    <li>Argo, küfür veya hakaret içeren ifadeler kullanmayın.</li>
                    <li>İlanla ilgili olmayan konulara girmeyin.</li>
                    <li>Yanıltıcı bilgi vermekten kaçının.</li>
                  </ul>
                  <h3 className="text-lg font-semibold text-red-600">Güvenlik Uyarıları</h3>
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    <p className="font-medium">Kişisel Bilgi Paylaşımı:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Telefon numarası, adres veya kimlik bilgilerinizi paylaşmayın.</li>
                      <li>Banka hesap bilgilerinizi asla mesaj yoluyla vermeyin.</li>
                    </ul>
                    <p className="font-medium mt-2">Güven İstismarı:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Ön ödeme talep eden kişilere karşı dikkatli olun.</li>
                      <li>Görüşmeden alışveriş yapmayın; ürünü görüp kontrol edin.</li>
                      <li>Şüpheli davranışları platforma bildirin.</li>
                    </ul>
                  </div>
                </div>
              </Modal>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
            <p>Kendi ilanınıza mesaj gönderemezsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}