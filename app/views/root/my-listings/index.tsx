"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Listing } from "@shared/schemas";
import ListingCard from "@app/components/listing-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@app/components/ui/tabs";
import { motion } from "framer-motion";

interface ListingWithCategory extends Listing {
  categoryName: string;
}

interface MyListingsProps {
  initialListings: ListingWithCategory[];
}

export default function MyListings({ initialListings }: MyListingsProps) {
  const router = useRouter();
  const { toast } = useToast();

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
        "İlanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
      window.confirm("İlanı pasif duruma getirmek istediğinizden emin misiniz?")
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
          description:
            error.message || "İlan pasif duruma getirilirken bir hata oluştu",
          variant: "destructive",
        });
      }
    }
  };

  const { data: listings, refetch } = useQuery<ListingWithCategory[]>({
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
  const totalCount = pendingCount + activeCount + rejectedCount + inactiveCount;

  const ListingGrid = ({
    listings,
    emptyMessage,
    color,
  }: {
    listings: ListingWithCategory[];
    emptyMessage: string;
    color: string;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.length > 0 ? (
        listings.map((listing) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ListingCard
              listing={listing}
              isActive={(listing.approved && listing.active) || false}
              onEdit={() => handleEdit(listing.id)}
              onDelete={() => handleDelete(listing.id)}
              onDeactivate={
                listing.approved && listing.active
                  ? () => handleDeactivate(listing.id)
                  : undefined
              }
            />
          </motion.div>
        ))
      ) : (
        <div className="col-span-full">
          <div className={`bg-${color}-50 rounded-lg p-8 text-center`}>
            <p className={`text-${color}-600 text-lg`}>{emptyMessage}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-200px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">İlanlarım</h1>
        <p className="text-gray-600">Toplam {totalCount} ilan bulunmakta</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
          >
            Aktif
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
              {activeCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
          >
            Onay Bekleyen
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              {pendingCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800"
          >
            Reddedilen
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
              {rejectedCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="inactive"
            className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
          >
            Pasif
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
              {inactiveCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-xl shadow-sm border">
          <TabsContent value="active" className="p-6 m-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-green-800">
                Aktif İlanlar
              </h2>
              <button
                onClick={() => router.push("/ilan-ekle")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                Yeni İlan Ekle
              </button>
            </div>
            <ListingGrid
              listings={activeListings}
              emptyMessage="Aktif ilanınız bulunmuyor. Yeni bir ilan eklemek için 'Yeni İlan Ekle' butonuna tıklayın."
              color="green"
            />
          </TabsContent>

          <TabsContent value="pending" className="p-6 m-0">
            <h2 className="text-xl font-semibold text-blue-800 mb-6">
              Onay Bekleyen İlanlar
            </h2>
            <ListingGrid
              listings={pendingListings}
              emptyMessage="Onay bekleyen ilanınız bulunmuyor."
              color="blue"
            />
          </TabsContent>

          <TabsContent value="rejected" className="p-6 m-0">
            <h2 className="text-xl font-semibold text-red-800 mb-6">
              Reddedilen İlanlar
            </h2>
            <ListingGrid
              listings={rejectedListings}
              emptyMessage="Reddedilmiş ilanınız bulunmuyor."
              color="red"
            />
          </TabsContent>

          <TabsContent value="inactive" className="p-6 m-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Pasif İlanlar
            </h2>
            <ListingGrid
              listings={inactiveListings}
              emptyMessage="Pasif ilanınız bulunmuyor."
              color="gray"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
