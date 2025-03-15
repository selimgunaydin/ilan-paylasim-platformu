// ilan/[slug]/ListingDetailClient.tsx
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageForm } from "@app/components/message-form";
import Link from "next/link";
import { Badge } from "@app/components/ui/badge";
import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Listing, Category } from "@shared/schemas";
import { useToast } from "@/hooks/use-toast";
import { ImageGallery } from "@app/components/image-gallery";
import { Star, StarOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useCallback, useState } from "react";
import { Modal } from "@app/components/ui/modal";
import { useSocket } from "@/providers/socket-provider";

type User = {
  id: string;
  // Add other user properties as needed
};

type Props = {
  initialListing: Listing;
  initialCategories: Category[];
  initialSimilarListings: Listing[];
  user: User | null;
  slug: string;
};

export default function ListingDetailClient({
  initialListing,
  initialCategories,
  initialSimilarListings,
  user,
  slug,
}: Props) {
  const { toast } = useToast();
  const { socket } = useSocket();
  const id = slug.split("-").pop()!;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: favoriteStatus } = useQuery({
    queryKey: ["favorites", id],
    queryFn: async () => {
      if (!user) return { isFavorite: false };
      const res = await fetch(`/api/favorites/check/${id}`);
      if (!res.ok) throw new Error("Favori durumu kontrol edilemedi");
      return res.json();
    },
    enabled: !!user && !!id,
    initialData: { isFavorite: false },
  });

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
    if (initialListing.userId == Number(user.id)) {
      toast({
        title: "Uyarı",
        description: "Kendi ilanınızı favorilere ekleyemezsiniz",
        variant: "destructive",
      });
      return;
    }
    if (favoriteStatus?.isFavorite) {
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
        receiverId: initialListing?.userId,
        files: files || [],
        createdAt: new Date().toISOString(),
        isRead: false,
      };
    },
    [user]
  );

  const category = initialCategories.find((c) => c.id === initialListing.categoryId);
  const parentCategory = category?.parentId
    ? initialCategories.find((c) => c.id === category.parentId)
    : null;

  return (
    <div className="py-8">
      <nav className="flex mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Anasayfa</Link>
        <span className="mx-2">/</span>
        {parentCategory && (
          <>
            <Link href={`/kategori/${parentCategory.slug}`} className="hover:text-blue-600">
              {parentCategory.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        {category && (
          <>
            <Link href={`/kategori/${category.slug}`} className="hover:text-blue-600">
              {category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-900">{initialListing.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl font-bold">{initialListing.title}</h1>
                {initialListing.listingType === "premium" && (
                  <Badge className="bg-yellow-500">Öncelikli İlan</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {initialListing.images && initialListing.images.length > 0 && (
                <div className="mb-6">
                  <ImageGallery images={initialListing.images} title={initialListing.title} />
                </div>
              )}
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-lg">{initialListing.description}</p>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">İlan Sahibine Mesaj Gönder</h3>
                {!user ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                    <p>
                      Mesaj göndermek için <Link href="/auth" className="text-blue-600 hover:underline">giriş</Link> yapmalısınız.
                    </p>
                  </div>
                ) : initialListing.userId && Number(user.id) != initialListing.userId ? (
                  <>
                    <MessageForm
                      socket={socket}
                      receiverId={initialListing.userId}
                      onSuccess={handleMessageSuccess}
                      listingId={initialListing.id}
                    />
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
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Benzer İlanlar</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {initialSimilarListings
                  ?.filter((l) => l.id !== initialListing.id && l.listingType === "premium")
                  .slice(0, 5)
                  .map((similarListing) => (
                    <Link
                      key={similarListing.id}
                      href={`/ilan/${createSeoUrl(similarListing.title)}-${similarListing.id}`}
                      className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <h3 className="font-semibold mb-2">{similarListing.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{similarListing.description}</p>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">İlan Bilgileri</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Güncelleme Tarihi</p>
                <p className="font-medium">
                  {initialListing.createdAt
                    ? format(new Date(initialListing.createdAt), "dd MMMM yyyy", { locale: tr })
                    : "Tarih bilgisi yok"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Şehir</p>
                <p className="font-medium">{initialListing.city}</p>
              </div>
              {initialListing.contactPerson && (
                <div>
                  <p className="text-sm text-gray-500">İlan Sahibi</p>
                  <p className="font-medium">{initialListing.contactPerson}</p>
                </div>
              )}
              {initialListing.phone && (
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <p className="font-medium">{initialListing.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">İlan Görüntülenme</p>
                <p className="font-medium">{initialListing.views || 0}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={toggleFavorite}
                  disabled={addToFavorites.isPending || removeFromFavorites.isPending}
                >
                  {favoriteStatus?.isFavorite ? (
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-5 w-5" />
                  )}
                  {favoriteStatus?.isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Reklam Alanı</h3>
              <p className="text-sm opacity-90">
                Bu alanda sponsorlu içerik veya reklam gösterilebilir
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const createSeoUrl = (title: string): string =>
  title.toLowerCase().replace(/ /g, "-");