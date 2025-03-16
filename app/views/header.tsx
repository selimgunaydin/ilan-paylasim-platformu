'use client'

import { Button } from "../components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@app/components/ui/navigation-menu";
import { Menu, X, ListPlus, Star, Send, MessageCircle, User, Home, Search, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@app/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchUnreadMessages, selectIncomingUnreadMessages, selectOutgoingUnreadMessages } from "../redux/slices/messageSlice";
import { Badge } from "../components/ui/badge";
import { useSocket } from "@/providers/socket-provider";

// MenuItem türünü genişletelim
interface MenuItem {
  label: string;
  icon: any;
  path: string;
  unreadCount?: number;
}

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Redux state'ten okunmamış mesaj sayılarını al
  const incomingUnreadMessages = useAppSelector(selectIncomingUnreadMessages);
  const outgoingUnreadMessages = useAppSelector(selectOutgoingUnreadMessages);
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();

  // Okunmamış mesaj sayısını yükle
  useEffect(() => {
    if (user) {
      dispatch(fetchUnreadMessages());
    }
  }, [dispatch, user]);

  // Socket.IO ile gerçek zamanlı mesaj bildirimlerini dinle
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Yeni bir mesaj veya konuşma geldiğinde okunmamış mesaj sayısını güncelle
    const handleMessageNotification = () => {
      dispatch(fetchUnreadMessages());
    };

    // Socket olaylarını dinle
    socket.on('messageNotification', handleMessageNotification);
    socket.on('newConversation', handleMessageNotification);
    
    // Temizlik
    return () => {
      socket.off('messageNotification', handleMessageNotification);
      socket.off('newConversation', handleMessageNotification);
    };
  }, [socket, isConnected, dispatch, user]);

  // Kullanıcı menüsü seçenekleri - hem mobil hem masaüstü görünümde kullanılacak
  const userMenuItems: MenuItem[] = [
    { label: "İlanlarım", icon: ListPlus, path: "/ilanlarim" },
    { label: "Favorilerim", icon: Star, path: "/favorilerim" },
    { 
      label: "Gönderilen", 
      icon: Send, 
      path: "/gonderilen-mesajlar",
      unreadCount: outgoingUnreadMessages
    },
    { 
      label: "Gelen", 
      icon: MessageCircle, 
      path: "/gelen-mesajlar",
      unreadCount: incomingUnreadMessages
    },
    { label: "Profilim", icon: User, path: "/profilim" },
  ];


  return (
    <header className={`sticky top-0 left-0 right-0 z-30 transition-all duration-300 bg-white shadow-md`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <h1 className={`text-2xl font-bold text-blue-600 transition-colors duration-300`}>
                İlan Platformu
              </h1>
            </Link>
          </div>

          {/* Mobil menü butonu */}
          <button
            className="md:hidden p-2 bg-white/20 backdrop-blur-sm rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className={`h-6 w-6 text-blue-700}`} />
            ) : (
              <Menu className={`h-6 w-6 text-blue-700}`} />
            )}
          </button>

          {/* Masaüstü Navigasyon */}
          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-6 mr-4">
              <Link href="/" className={`flex items-center gap-1 text-gray-700} hover:text-blue-500 transition-colors`}>
                <Home className="h-5 w-5" />
                <span>Ana Sayfa</span>
              </Link>
            </div>

            {user ? (
              <>
                {/* Kullanıcı menüsü - Masaüstü */}
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={`px-4 py-2 rounded-full bg-blue-50 text-blue-700}`}>
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span>{user.name || 'Hesabım'}</span>
                          {(incomingUnreadMessages + outgoingUnreadMessages) > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {incomingUnreadMessages + outgoingUnreadMessages}
                            </Badge>
                          )}
                        </div>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[220px] p-2">
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.path}
                              href={item.path}
                              className="flex items-center justify-between gap-2 p-2 hover:bg-blue-50 rounded-md cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="h-5 w-5 text-blue-600" />
                                <span>{item.label}</span>
                              </div>
                              {item.unreadCount && item.unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-auto text-xs">
                                  {item.unreadCount}
                                </Badge>
                              )}
                            </Link>
                          ))}
                          <div className="border-t my-2"></div>
                          <div
                            onClick={() => {
                              signOut({ redirect: false });
                              router.push("/");
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-600 rounded-md cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                            <span>Çıkış Yap</span>
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>

                <Link href="/ilan-ekle">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all">
                    Ücretsiz İlan Ver
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className={`border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors`}>
                    Giriş / Üyelik
                  </Button>
                </Link>
                <Link href="/ilan-ekle">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all">
                    Ücretsiz İlan Ver
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobil Navigasyon */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg md:hidden">
              <nav className="flex flex-col p-4 space-y-3">
                <Link href="/" className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-md">
                  <Home className="h-5 w-5 text-blue-600" />
                  <span>Ana Sayfa</span>
                </Link>
                <Link href="/kategoriler" className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-md">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span>Kategoriler</span>
                </Link>
                
                <div className="border-t my-2"></div>
                
                {user ? (
                  <>
                    {/* Kullanıcı menüsü - Mobil */}
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center justify-between gap-2 p-2 hover:bg-blue-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-5 w-5 text-blue-600" />
                          <span>{item.label}</span>
                        </div>
                        {item.unreadCount && item.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto text-xs">
                            {item.unreadCount}
                          </Badge>
                        )}
                      </Link>
                    ))}

                    <Link href="/ilan-ekle">
                      <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        Ücretsiz İlan Ver
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-center border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        signOut({ redirect: false });
                        router.push("/");
                      }}
                    >
                      Çıkış Yap
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button variant="outline" className="w-full justify-center border-blue-600 text-blue-600 hover:bg-blue-50">
                        Giriş / Üyelik
                      </Button>
                    </Link>
                    <Link href="/ilan-ekle">
                      <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        Ücretsiz İlan Ver
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}