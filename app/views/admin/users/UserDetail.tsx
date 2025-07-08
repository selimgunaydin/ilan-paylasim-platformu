"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, Phone, MapPin, User, Calendar, Info, Shield, Star, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { User as UserType, Listing } from "@shared/schemas";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useSocket } from "@/providers/socket-provider";
import { AdminMessageForm } from "@app/components/admin-message-form";


interface UserDetailResponse {
  user: UserType;
  listings: Listing[];
}

export default function UserDetailView({ userId }: { userId: number }) {
  const router = useRouter();
  const { toast } = useToast();
    const { socket } = useSocket();
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  const { data, isLoading, error } = useQuery<UserDetailResponse, Error>({
    queryKey: [`/api/admin/users/${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error("Kullanıcı bilgileri yüklenirken bir hata oluştu");
      }
      return res.json();
    },
  });
  // UserDetail.tsx'te useEffect içine ekleyin
useEffect(() => {
  console.log('Socket durumu:', {
    socket: !!socket,
    connected: socket?.connected,
    id: socket?.id
  });
}, [socket]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-500">{error.message}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-yellow-500" />
        <p>Kullanıcı bulunamadı</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
        </Button>
      </div>
    );
  }

  const { user, listings } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/yonetim/users"
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kullanıcı Listesine Dön
        </Link>
        <div className="flex gap-2">
          <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                Mesaj Gönder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{user.username} kullanıcısına mesaj gönder</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {!socket || !socket.connected ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">Sunucuya bağlanılıyor...</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Yeniden Dene
                    </Button>
                  </div>
                ) : (
                  <AdminMessageForm
                    receiverId={user.id}
                    listingId={listings?.[0]?.id}
                    onSuccess={() => {
                      toast({
                        title: "Başarılı",
                        description: "Mesaj başarıyla gönderildi",
                      });
                      setIsMessageOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['user', userId] });
                    }}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant={user.status ? "destructive" : "default"}
            size="sm"
            onClick={async () => {
              try {
                await fetch(`/api/admin/users/${user.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ status: !user.status })
                });

                queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${user.id}`] });
                toast({
                  title: "Başarılı",
                  description: "Kullanıcı durumu güncellendi"
                });

                // Sayfayı yenile
                window.location.reload();
              } catch (error) {
                toast({
                  title: "Hata",
                  description: "Kullanıcı durumu güncellenemedi",
                  variant: "destructive"
                });
              }
            }}
          >
            {user.status ? "Kullanıcıyı Banla" : "Kullanıcıyı Aktif Et"}
          </Button>
          {/* <Button variant="outline" size="sm">Düzenle</Button> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user.username}
            {user.isAdmin && (
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                <Shield className="w-3 h-3 mr-1" /> Admin
              </Badge>
            )}
            {user.yuksekUye && (
              <Badge variant="outline" className="border-purple-500 text-purple-500">
                <Star className="w-3 h-3 mr-1" /> Yüksek Üye
              </Badge>
            )}
            {!user.yuksekUye && !user.isAdmin && (
              <Badge variant="outline" className="border-blue-500 text-blue-500">
                <User className="w-3 h-3 mr-1" /> Standart Üye
              </Badge>
            )}
            {!user.status && (
              <Badge variant="destructive" className="ml-2">
                Banlanmış
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Kullanıcı Bilgileri</TabsTrigger>
              <TabsTrigger value="listings">İlanlar ({listings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Temel Bilgiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Kullanıcı Adı</p>
                        <p className="font-medium">{user.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">E-posta</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">{user.phone || 'Belirtilmemiş'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Şehir</p>
                        <p className="font-medium">{user.city || 'Belirtilmemiş'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cinsiyet</p>
                        <p className="font-medium">
                          {user.gender === 'male' ? 'Erkek' : user.gender === 'female' ? 'Kadın' : 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Diğer Bilgiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Üyelik Tarihi</p>
                        <p className="font-medium">
                          {user.createdAt ? format(new Date(user.createdAt), 'd MMMM yyyy', { locale: tr }) : 'Bilinmiyor'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Üyelik Durumu</p>
                        <Badge variant={user.status ? 'default' : 'destructive'} className="mt-1">
                          {user.status ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Son Giriş</p>
                        <p className="font-medium">
                          {user.lastSeen
                            ? format(new Date(user.lastSeen), 'd MMMM yyyy HH:mm', { locale: tr })
                            : 'Bilinmiyor'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hakkında</p>
                        <p className="font-medium">
                          {user.aboutMe || 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="listings" className="pt-6">
              {listings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Henüz ilan bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <Card key={listing.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="font-medium">
                              <Link
                                href={`/yonetim/ilan/${listing.id}`}
                                // target="_blank"
                                className="hover:underline"
                              >
                                {listing.title}
                              </Link>
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>{listing.city}</span>
                              <span>•</span>
                              <span>
                                {listing.createdAt ? format(new Date(listing.createdAt), 'dd.MM.yyyy', { locale: tr }) : 'Bilinmiyor'}
                              </span>
                              <span>•</span>
                              <span>{listing.views} görüntülenme</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                listing.approved === false ? 'secondary' :
                                  listing.active ? 'default' : 'destructive'
                              }
                            >
                              {listing.approved === false ? 'Onay Bekliyor' :
                                listing.active ? 'Aktif' : 'Pasif'}
                            </Badge>
                            <Badge variant="outline">
                              {listing.listingType === 'premium' ? 'Premium' : 'Standart'}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/yonetim/ilan/${listing.id}`}>
                                İncele
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
