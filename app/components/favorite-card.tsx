import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { Listing } from "@shared/schema";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface FavoriteCardProps {
  listing: Listing & { 
    category?: { 
      id: number; 
      name: string; 
      parentId: number | null;
      slug: string;
      order: number;
    } 
  };
}

export default function FavoriteCard({ listing }: FavoriteCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const createdAt = listing.createdAt
    ? new Date(listing.createdAt)
    : new Date();
  const expiryDate = listing.expiresAt
    ? new Date(listing.expiresAt)
    : addDays(createdAt, 30);

  // Favori kaldırma işlemi - yeni API endpoint'ini kullanıyoruz
  const removeFromFavorites = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorites/${listing.id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Favorilerden çıkarılamadı");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: "Başarılı",
        description: data.message || "İlan favorilerden çıkarıldı",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // İlan detayına gitme işlemi
  const goToListingDetail = () => {
    router.push(`/ilan/${encodeURIComponent(listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-${listing.id}`);
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <a
          href={`/ilan/${encodeURIComponent(listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-${listing.id}`}
          className="hover:text-blue-600"
        >
          <h3 className="text-lg font-semibold line-clamp-2">
            {listing.title}
          </h3>
        </a>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Eklenme Tarihi:</span>{" "}
            {format(createdAt, "dd MMMM yyyy", { locale: tr })}
          </p>
          <p>
            <span className="font-medium">Son Yayın Tarihi:</span>{" "}
            {format(expiryDate, "dd MMMM yyyy", { locale: tr })}
          </p>
          <p>
            <span className="font-medium">İlan Tipi:</span>{" "}
            {listing.listingType === "premium" ? "Öncelikli" : "Standart"}
          </p>
          {listing.category && (
            <p>
              <span className="font-medium">Kategori:</span>{" "}
              {listing.category.name}
            </p>
          )}
          <p>
            <span className="font-medium">Şehir:</span>{" "}
            {listing.city || "Belirtilmemiş"}
          </p>
          <p>
            <span className="font-medium">Görülme:</span> {listing.views || 0}
          </p>
          <p>
            <span className="font-medium">Durum:</span>{" "}
            {!listing.approved ? (
              <span className="text-red-500">Reddedildi</span>
            ) : !listing.active ? (
              <span className="text-orange-500">Pasif</span>
            ) : (
              <span className="text-green-500">Aktif</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          {/* İlan detayına git butonu */}
          <Button onClick={goToListingDetail} variant="outline" className="flex-1">
            İlanı Görüntüle
          </Button>
          
          {/* Favorilerden çıkar butonu */}
          <Button 
            onClick={() => removeFromFavorites.mutate()} 
            variant="ghost" 
            className="flex-1 gap-2"
            disabled={removeFromFavorites.isPending}
          >
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            Favorilerden Çıkar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 