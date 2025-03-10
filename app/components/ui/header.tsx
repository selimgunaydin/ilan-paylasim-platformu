'use client'

import { Button } from "./button";
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

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Kullanıcı menüsü seçenekleri - hem mobil hem masaüstü görünümde kullanılacak
  const userMenuItems = [
    { label: "İlanlarım", icon: ListPlus, path: "/ilanlarim" },
    { label: "Favorilerim", icon: Star, path: "/favorilerim" },
    { label: "Gönderilen", icon: Send, path: "/gonderilen-mesajlar" },
    { label: "Gelen", icon: MessageCircle, path: "/gelen-mesajlar" },
    { label: "Profilim", icon: User, path: "/profilim" },
  ];

  // Aktif tab'ı belirle
  const activeTab = pathname ? userMenuItems.find((item) => pathname === item.path)?.path : "/ilanlarim";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white shadow-md`}>
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
                        </div>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[220px] p-2">
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.path}
                              href={item.path}
                              className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-md cursor-pointer"
                            >
                              <item.icon className="h-5 w-5 text-blue-600" />
                              <span>{item.label}</span>
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
                        className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-md"
                      >
                        <item.icon className="h-5 w-5 text-blue-600" />
                        <span>{item.label}</span>
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