'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@app/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@app/components/ui/badge";
import { Separator } from "@app/components/ui/separator";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent } from "@app/components/ui/card";
import { useParams, useRouter } from "next/navigation";

export default function ListingDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: listing, isLoading, isError } = useQuery({
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
      if (!data) throw new Error("İlan bulunamaqwedı");
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('İlan onaylanamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-listings'] });
      toast({
        title: "Başarılı",
        description: "İlan onaylandı",
      });
      router.push('/yonetim/onaybekleyenilanlar');
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan onaylanırken bir hata oluştu",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: 'PUT'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'İlan reddedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-listings'] });
      toast({
        title: "Başarılı",
        description: "İlan reddedildi",
      });
      router.push('/yonetim/onaybekleyenilanlar');
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleApprove = async () => {
    if (window.confirm('Bu ilanı onaylamak istediğinize emin misiniz?')) {
      await approveMutation.mutateAsync();
    }
  };

  const handleReject = async () => {
    if (window.confirm('Bu ilanı reddetmek istediğinize emin misiniz?')) {
      await rejectMutation.mutateAsync();
    }
  };

  if (isLoading) return <div className="p-8 text-center mt-24">Yükleniyor...</div>;
  if (isError || !listing) return <div className="p-8 text-center text-red-500 mt-24">İlan bulunamadı</div>;

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">İlan İnceleme</h1>
        <Button variant="outline" onClick={() => router.push('/yonetim/onaybekleyenilanlar')}>
          Listeye Dön
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{listing.title}</h2>
              <Badge variant={listing.listingType === 'premium' ? 'default' : 'secondary'}>
                {listing.listingType === 'premium' ? 'Premium' : 'Standart'}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">İlan Detayları</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Kategori</dt>
                    <dd className="font-medium">{listing.category?.name || 'Belirtilmemiş'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Şehir</dt>
                    <dd className="font-medium">{listing.city}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Eklenme Tarihi</dt>
                    <dd className="font-medium">
                      {format(new Date(listing.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">İletişim Telefonu</dt>
                    <dd className="font-medium">{listing.phone || 'Belirtilmemiş'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">İletişim Kişisi</dt>
                    <dd className="font-medium">{listing.contactPerson || 'Belirtilmemiş'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-medium mb-2">İlan Sahibi</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Kullanıcı Adı</dt>
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
                <p className="text-muted-foreground">Bu ilan için görsel bulunmuyor.</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">İlan Açıklaması</h3>
              <p className="whitespace-pre-wrap text-gray-700">{listing.description}</p>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <Button variant="destructive" onClick={handleReject}>
                Reddet
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                Onayla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}