'use client'

import * as React from "react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  PowerOff, 
  MessageSquare, 
  TrendingUp,
  Eye,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Veri tipleri
interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalMessages: number;
  recentUsers: {
    id: number;
    username: string;
    email: string;
    createdAt: string;
  }[];
  recentListings: {
    id: number;
    title: string;
    createdAt: string;
    approved: boolean;
    active: boolean;
  }[];
}

// Aktivite tipi
interface Activity {
  id: string;
  type: 'user_registered' | 'listing_approved' | 'new_message' | 'listing_created' | 'listing_inactive';
  user?: string;
  sender?: string;
  listing?: string;
  title?: string;
  time: string;
  timestamp: number;
}

export default function ManagementHome({ children }: { children?: React.ReactNode }) {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // İstatistikleri API'den çek
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard-stats');
        
        if (!response.ok) {
          throw new Error('İstatistikler alınırken bir hata oluştu');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('İstatistik alma hatası:', err);
        setError('Verileri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);
  
  // Aktiviteleri son kullanıcı ve ilan bilgilerinden oluştur
  const generateActivities = (): Activity[] => {
    if (!stats) return [];
    
    const activities: Activity[] = [];
    
    // Son kullanıcılardan aktivite oluştur
    stats.recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_registered',
        user: user.username,
        time: formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: tr }),
        timestamp: new Date(user.createdAt).getTime()
      });
    });
    
    // Son ilanlardan aktivite oluştur
    stats.recentListings.forEach(listing => {
      const activityType = listing.approved 
        ? 'listing_approved' 
        : listing.active 
          ? 'listing_created' 
          : 'listing_inactive';
      
      activities.push({
        id: `listing-${listing.id}`,
        type: activityType as Activity['type'],
        title: listing.title,
        time: formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: tr }),
        timestamp: new Date(listing.createdAt).getTime()
      });
    });
    
    // Zaman damgasına göre sırala (en yeni en üstte)
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6); // Sadece son 6 aktiviteyi göster
  };
  
  // Aktiviteleri oluştur
  const recentActivities = generateActivities();

  // Yükleme durumunda skeleton göster
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main>
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8 space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Hata durumunda hata mesajını göster
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main>
          <div className="container mx-auto px-4 py-8">
            <div className="rounded-md bg-red-50 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Hata</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={() => window.location.reload()}
                      size="sm"
                      variant="outline"
                    >
                      Yeniden Dene
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ana İçerik */}
      <main>
        <div className="container mx-auto px-4 py-8">
          {children ?? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Hoş Geldiniz, {admin?.username}</h1>
                <p className="text-gray-600 mt-2">
                  İşlem özeti ve platform istatistikleri aşağıda gösteriliyor.
                </p>
              </div>
              
              {/* İstatistik Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Üye</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">Kayıtlı kullanıcı</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Onay Bekleyen İlanlar</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingListings || 0}</div>
                    <p className="text-xs text-muted-foreground">İnceleme bekliyor</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/yonetim/onaybekleyenilanlar" className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        İncele
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Aktif İlanlar</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeListings || 0}</div>
                    <p className="text-xs text-muted-foreground">Yayında olan</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pasif İlanlar</CardTitle>
                    <PowerOff className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats ? (stats.totalListings - stats.activeListings - stats.pendingListings) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Yayında olmayan</p>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                    <p className="text-xs text-muted-foreground">İlan mesajları</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/yonetim/tummesajlar" className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        Tüm Mesajlar
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
                
              </div>
              
              {/* Hızlı Erişim Butonları */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Hızlı Erişim</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/yonetim/users">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>Üye Yönetimi</span>
                    </Button>
                  </Link>
                  <Link href="/yonetim/onaybekleyenilanlar">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Onay Bekleyenler</span>
                    </Button>
                  </Link>
                  <Link href="/yonetim/kategoriler">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Kategori Yönetimi</span>
                    </Button>
                  </Link>
                  <Link href="/yonetim/ayarlar">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>Sistem Ayarları</span>
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Son Aktiviteler */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Son Aktiviteler</h2>
                <Card>
                  <CardContent className="pt-6">
                    {recentActivities.length > 0 ? (
                      <ul className="space-y-4">
                        {recentActivities.map((activity) => (
                          <li key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                            <div className={`rounded-full p-1.5 ${getActivityIconBackground(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{getActivityDescription(activity)}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">Henüz aktivite bulunmuyor</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full">
                      Tüm Aktiviteleri Görüntüle
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Aktivite iconlarını ve açıklamalarını oluşturan yardımcı fonksiyonlar
function getActivityIcon(type: string) {
  switch (type) {
    case 'user_registered':
      return <Users className="h-4 w-4 text-white" />;
    case 'listing_approved':
      return <CheckCircle2 className="h-4 w-4 text-white" />;
    case 'new_message':
      return <MessageSquare className="h-4 w-4 text-white" />;
    case 'listing_created':
      return <AlertTriangle className="h-4 w-4 text-white" />;
    case 'listing_inactive':
      return <PowerOff className="h-4 w-4 text-white" />;
    default:
      return <Eye className="h-4 w-4 text-white" />;
  }
}

function getActivityIconBackground(type: string) {
  switch (type) {
    case 'user_registered':
      return 'bg-blue-500';
    case 'listing_approved':
      return 'bg-green-500';
    case 'new_message':
      return 'bg-indigo-500';
    case 'listing_created':
      return 'bg-amber-500';
    case 'listing_inactive':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

function getActivityDescription(activity: any) {
  switch (activity.type) {
    case 'user_registered':
      return `Yeni üye kaydı: ${activity.user}`;
    case 'listing_approved':
      return `İlan onaylandı: ${activity.title}`;
    case 'new_message':
      return `Yeni mesaj: ${activity.sender} (${activity.listing})`;
    case 'listing_created':
      return `Yeni ilan oluşturuldu: ${activity.title}`;
    case 'listing_inactive':
      return `İlan pasif edildi: ${activity.title}`;
    default:
      return 'Bilinmeyen aktivite';
  }
}