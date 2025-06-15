"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@app/components/ui/button";
import { Badge } from "@app/components/ui/badge";
import { Separator } from "@app/components/ui/separator";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent } from "@app/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// İlan durumuna göre butonları dinamik gösteren fonksiyon
function renderListingActionButtons(
  // Debug: status'u konsola yazdır
  status: string,
  {
    handleApprove,
    handleReject,
    handleDelete,
    handleActivate,
    approvePending,
    rejectPending,
    deletePending,
    activatePending,
  }: {
    handleApprove: () => void;
    handleReject: () => void;
    handleDelete: () => void;
    handleActivate: () => void;
    approvePending: boolean;
    rejectPending: boolean;
    deletePending: boolean;
    activatePending: boolean;
  }
) {
  // Debug: status'u konsola yazdır
  console.log("[DEBUG] renderListingActionButtons status:", status);
  switch (status) {
    case "active":
      return (
        <Button variant="destructive" onClick={handleDelete} disabled={deletePending}>
          İlanı Sil
        </Button>
      );
    case "pending":
      return (
        <>
          <Button variant="destructive" onClick={handleReject} disabled={rejectPending}>
            Reddet
          </Button>
          <Button onClick={handleApprove} disabled={approvePending}>
            Onayla
          </Button>
        </>
      );
    case "inactive":
      return (
        <>
          <Button onClick={handleActivate} disabled={activatePending}>
            Yayına Al
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deletePending}>
            Sil
          </Button>
        </>
      );
    case "rejected":
      return (
        <Button variant="destructive" onClick={handleDelete} disabled={deletePending}>
          İlanı Sil
        </Button>
      );
    default:
      return (
        <span className="text-xs text-red-500">Durum: {String(status) || "(boş)"}</span>
      );
  }
}

export default function ListingDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "listing", id],
    queryFn: async () => {
      console.log("Fetching listing with ID:", id);
      const res = await fetch(`/api/admin/listings/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error:", errorData); // Add error logging
        throw new Error(errorData.error || "İlan yüklenemedi");
      }
      const data = await res.json();
      console.log("Received listing data:", data); // Add response logging
      if (!data) throw new Error("İlan bulunamadı");
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("İlan onaylanamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan onaylandı",
      });
      router.push("/yonetim/onaybekleyenilanlar");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan onaylanırken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: "PUT",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "İlan reddedilemedi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan reddedildi",
      });
      router.push("/yonetim/onaybekleyenilanlar");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${id}/activate`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("İlan aktifleştirilemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listing", id] });
      toast({
        title: "Başarılı",
        description: "İlan yayına alındı",
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("İlan silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan silindi",
      });
      router.push("/yonetim/ilanlar");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = async () => {
    if (window.confirm("Bu ilanı onaylamak istediğinize emin misiniz?")) {
      await approveMutation.mutateAsync();
    }
  };

  const handleReject = async () => {
    if (window.confirm("Bu ilanı reddetmek istediğinize emin misiniz?")) {
      await rejectMutation.mutateAsync();
    }
  };

  const handleActivate = async () => {
    if (window.confirm("Bu ilanı yayına almak istediğinize emin misiniz?")) {
      await activateMutation.mutateAsync();
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      await deleteMutation.mutateAsync();
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  if (isError || !listing)
    return (
      <div className="p-8 text-center text-red-500 mt-24">İlan bulunamadı</div>
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">İlan İnceleme</h1>
        <Button
          onClick={() => router.back()}
          className=""
        >
          Geri Dön
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{listing.title}</h2>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    (listing.status === "active"
                      ? "bg-green-100 text-green-800"
                      : listing.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : listing.status === "inactive"
                          ? "bg-gray-100 text-gray-800"
                          : listing.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800") +
                    " hover:bg-none hover:bg-transparent hover:text-inherit"
                  }
                  style={{
                    pointerEvents: "none"
                  }}
                >
                  {listing.status === "active"
                    ? "Aktif"
                    : listing.status === "pending"
                      ? "Onay Bekliyor"
                      : listing.status === "inactive"
                        ? "Pasif"
                        : listing.status === "rejected"
                          ? "Reddedildi"
                          : "-"}
                </Badge>
                <Badge
                  variant={
                    listing.listingType === "premium" ? "default" : "secondary"
                  }
                >
                  {listing.listingType === "premium" ? "Premium" : "Standart"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">İlan Detayları</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Kategori</dt>
                    <dd className="font-medium">
                      {listing.user.username || "Belirtilmemiş"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Şehir</dt>
                    <dd className="font-medium">{listing.city}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Eklenme Tarihi
                    </dt>
                    <dd className="font-medium">
                      {format(
                        new Date(listing.createdAt),
                        "dd MMMM yyyy HH:mm",
                        { locale: tr }
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      İletişim Telefonu
                    </dt>
                    <dd className="font-medium">
                      {listing.phone || "Belirtilmemiş"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      İletişim Kişisi
                    </dt>
                    <dd className="font-medium">
                      {listing.contactPerson || "Belirtilmemiş"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-medium mb-2">İlan Sahibi</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Kullanıcı Adı
                    </dt>
                    <dd className="font-medium">{listing.user?.username}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">E-posta</dt>
                    <dd className="font-medium">{listing.user?.email}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">İlan Görselleri</h3>
              {listing.images && listing.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listing.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`İlan görseli ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Bu ilan için görsel bulunmuyor.
                </p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">İlan Açıklaması</h3>
              <div
                className="whitespace-pre-wrap text-gray-700 border rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: listing.description }}
              />
            </div>

            <div className="flex justify-end gap-4 mt-8">

              {renderListingActionButtons(listing.status, {
                handleApprove,
                handleReject,
                handleDelete,
                handleActivate,
                approvePending: approveMutation?.isPending || false,
                rejectPending: rejectMutation?.isPending || false,
                deletePending: deleteMutation?.isPending || false,
                activatePending: activateMutation?.isPending || false,
              })}

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
