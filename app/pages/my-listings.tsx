'use client'

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Listing } from "@shared/schemas";
import { Card, CardContent } from "@app/components/ui/card";
import ListingCard from "@app/components/listing-card";

interface MyListingsProps {
  initialListings: Listing[];
}

// İlanlarım sayfası - Dashboard'daki İlanlar tab içeriğinin aynısı
export default function MyListings({ initialListings }: MyListingsProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Mevcut dashboard.tsx'ten alınan sorgular ve işlevler
  const deleteMutation = useMutation({
    mutationFn: async (listingId: number) => {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("İlan silinemedi");
      return listingId;
    },
    onSuccess: async () => {
      toast({ title: "İlan silindi" });
      await refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (listingId: number) => {
      const res = await fetch(`/api/listings/${listingId}/deactivate`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("İlan pasif duruma getirilemedi");
      return listingId;
    },
    onSuccess: async () => {
      toast({ title: "İlan pasif duruma getirildi" });
      await refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (listingId: number) => {
    router.push(`/ilan-duzenle/${listingId}`);
  };

  const handleDelete = async (listingId: number) => {
    if (
      window.confirm(
        "İlanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      )
    ) {
      try {
        await deleteMutation.mutateAsync(listingId);
        await refetch();
        toast({
          title: "Başarılı",
          description: "İlan başarıyla silindi",
        });
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message || "İlan silinirken bir hata oluştu",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeactivate = async (listingId: number) => {
    if (
      window.confirm(
        "İlanı pasif duruma getirmek istediğinizden emin misiniz?",
      )
    ) {
      try {
        await deactivateMutation.mutateAsync(listingId);
        await refetch();
        toast({
          title: "Başarılı",
          description: "İlan başarıyla pasif duruma getirildi",
        });
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message || "İlan pasif duruma getirilirken bir hata oluştu",
          variant: "destructive",
        });
      }
    }
  };

  const { data: listings, refetch } = useQuery<Listing[]>({
    queryKey: ["listings", "user"],
    queryFn: () =>
      fetch("/api/listings/user").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch listings");
        return res.json();
      }),
    initialData: initialListings,
  });

  // Her kategori için ilanları filtrele
  const pendingListings =
    listings?.filter((l) => !l.approved && l.active) || [];
  const activeListings = listings?.filter((l) => l.approved && l.active) || [];
  const rejectedListings =
    listings?.filter((l) => !l.approved && !l.active) || [];
  const inactiveListings =
    listings?.filter((l) => l.approved && !l.active) || [];

  // İlan sayılarını hesapla
  const pendingCount = pendingListings.length;
  const activeCount = activeListings.length;
  const rejectedCount = rejectedListings.length;
  const inactiveCount = inactiveListings.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="space-y-8 p-6">
          {/* İlan kategorileri */}
          <div className="space-y-6">
            {/* Onay Bekleyen İlanlar */}
            <div className="rounded-lg bg-blue-50/50 border border-blue-100 overflow-hidden">
              <div className="bg-blue-100/50 px-6 py-3 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Onay Bekleyen İlanlar
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800">
                    {pendingCount}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isActive={false}
                      onEdit={() => handleEdit(listing.id)}
                      onDelete={() => handleDelete(listing.id)}
                    />
                  ))}
                  {pendingCount === 0 && (
                    <p className="col-span-full text-center text-blue-600/70 py-4">
                      Onay bekleyen ilanınız bulunmuyor
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Onaylanmış Aktif İlanlar */}
            <div className="rounded-lg bg-green-50/50 border border-green-100 overflow-hidden">
              <div className="bg-green-100/50 px-6 py-3 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-green-800">
                    Onaylanmış (Aktif) İlanlar
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-sm bg-green-100 text-green-800">
                    {activeCount}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isActive={true}
                      onEdit={() => handleEdit(listing.id)}
                      onDelete={() => handleDelete(listing.id)}
                      onDeactivate={() => handleDeactivate(listing.id)}
                    />
                  ))}
                  {activeCount === 0 && (
                    <p className="col-span-full text-center text-green-600/70 py-4">
                      Aktif ilanınız bulunmuyor
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reddedilmiş İlanlar */}
            <div className="rounded-lg bg-red-50/50 border border-red-100 overflow-hidden">
              <div className="bg-red-100/50 px-6 py-3 border-b border-red-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-red-800">
                    Reddedilmiş İlanlar
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-sm bg-red-100 text-red-800">
                    {rejectedCount}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejectedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isActive={false}
                      onEdit={() => handleEdit(listing.id)}
                      onDelete={() => handleDelete(listing.id)}
                    />
                  ))}
                  {rejectedCount === 0 && (
                    <p className="col-span-full text-center text-red-600/70 py-4">
                      Reddedilmiş ilanınız bulunmuyor
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pasif İlanlar */}
            <div className="rounded-lg bg-gray-50/50 border border-gray-100 overflow-hidden">
              <div className="bg-gray-100/50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Pasif İlanlar
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-sm bg-gray-100 text-gray-800">
                    {inactiveCount}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isActive={false}
                      onEdit={() => handleEdit(listing.id)}
                      onDelete={() => handleDelete(listing.id)}
                    />
                  ))}
                  {inactiveCount === 0 && (
                    <p className="col-span-full text-center text-gray-600/70 py-4">
                      Pasif ilanınız bulunmuyor
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
