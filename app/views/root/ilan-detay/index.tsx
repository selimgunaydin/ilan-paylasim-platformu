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
      toast({
        title: "Mesaj gönderildi",
        description: "İlan sahibine mesaj gönderildi",
      });
    },
    [user, listing]
  );

  return (
    <div className="p-3 sm:p-4">
      {/* Image Gallery */}
      {listing.images && listing.images.length > 0 && (
        <div className="mb-4">
          <ImageGallery
            images={listing.images}
            title={listing.title}
            categoryName={listing.categoryName}
          />
        </div>
      )}

      {/* Message Form */}
      <div className="mt-4 sm:mt-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          İlan Sahibine Mesaj Gönder
        </h3>
        {!user ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
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
            <div className="mt-3 sm:mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
              >
                Mesaj Güvenliği Hakkında Daha Fazla Bilgi
              </Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => setIsModalOpen(false)}
              >
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Mesajlaşırken Uyulması Gereken Kurallar
                  </h3>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700">
                    <li>Karşılıklı saygı çerçevesinde iletişim kurun.</li>
                    <li>
                      Argo, küfür veya hakaret içeren ifadeler kullanmayın.
                    </li>
                    <li>İlanla ilgili olmayan konulara girmeyin.</li>
                    <li>Yanıltıcı bilgi vermekten kaçının.</li>
                  </ul>
                  <h3 className="text-base sm:text-lg font-semibold text-red-600">
                    Güvenlik Uyarıları
                  </h3>
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 sm:p-4 rounded-lg">
                    <p className="font-medium">Kişisel Bilgi Paylaşımı:</p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm">
                      <li>
                        Telefon numarası, adres veya kimlik bilgilerinizi
                        paylaşmayın.
                      </li>
                      <li>
                        Banka hesap bilgilerinizi asla mesaj yoluyla vermeyin.
                      </li>
                    </ul>
                    <p className="font-medium mt-2">Güven İstismarı:</p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm">
                      <li>Ön ödeme talep eden kişilere karşı dikkatli olun.</li>
                      <li>
                        Görüşmeden alışveriş yapmayın; ürünü görüp kontrol edin.
                      </li>
                      <li>Şüpheli davranışları platforma bildirin.</li>
                    </ul>
                  </div>
                </div>
              </Modal>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
            <p>Kendi ilanınıza mesaj gönderemezsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
