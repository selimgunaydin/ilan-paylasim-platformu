'use client'

import { Button } from "../../../components/ui/button";
import { Menu, X, ListPlus, Star, Send, MessageCircle, User, Home, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchUnreadMessages, selectIncomingUnreadMessages, selectOutgoingUnreadMessages } from "../../../redux/slices/messageSlice";
import { Badge } from "../../../components/ui/badge";
import { useSocket } from "@/providers/socket-provider";
import { cn } from "@/lib/utils";

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

  const incomingUnreadMessages = useAppSelector(selectIncomingUnreadMessages);
  const outgoingUnreadMessages = useAppSelector(selectOutgoingUnreadMessages);
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (user) {
      dispatch(fetchUnreadMessages());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleMessageNotification = () => {
      dispatch(fetchUnreadMessages());
    };

    socket.on('messageNotification', handleMessageNotification);
    socket.on('newConversation', handleMessageNotification);

    return () => {
      socket.off('messageNotification', handleMessageNotification);
      socket.off('newConversation', handleMessageNotification);
    };
  }, [socket, isConnected, dispatch, user]);

  const userMenuItems: MenuItem[] = [
    { label: "İlanlarım", icon: ListPlus, path: "/ilanlarim" },
    { label: "Favorilerim", icon: Star, path: "/favorilerim" },
    { label: "Gönderilen", icon: Send, path: "/gonderilen-mesajlar", unreadCount: outgoingUnreadMessages },
    { label: "Gelen", icon: MessageCircle, path: "/gelen-mesajlar", unreadCount: incomingUnreadMessages },
    { label: "Profilim", icon: User, path: "/profilim" },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              İlan Platformu
            </h1>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Ana Sayfa</span>
            </Link>

            {user ? (
              <>
                {/* Horizontal Menu Items */}
                <div className="flex items-center gap-4">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200",
                        pathname === item.path && "bg-blue-100 text-blue-700"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {item.unreadCount && item.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-1 text-xs font-semibold">
                          {item.unreadCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>

                <Link href="/ilan-ekle">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200">
                    Ücretsiz İlan Ver
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold py-2 px-4 rounded-full transition-all duration-200"
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
                  <Button
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-4 rounded-full transition-all duration-200"
                  >
                    Giriş / Üyelik
                  </Button>
                </Link>
                <Link href="/ilan-ekle">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200">
                    Ücretsiz İlan Ver
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav
            className={cn(
              "absolute top-0 left-0 w-3/4 max-w-xs bg-white h-full shadow-xl transform transition-transform duration-300 ease-in-out",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Menü</span>
                <button
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              <Link href="/" className="flex items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition-colors">
                <Home className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Ana Sayfa</span>
              </Link>
              <Link href="/kategoriler" className="flex items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition-colors">
                <Search className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Kategoriler</span>
              </Link>

              <div className="border-t border-gray-200 my-2" />

              {user ? (
                <>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="flex items-center justify-between gap-2 p-3 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-700 font-medium">{item.label}</span>
                      </div>
                      {item.unreadCount && item.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {item.unreadCount}
                        </Badge>
                      )}
                    </Link>
                  ))}

                  <Link href="/ilan-ekle">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      Ücretsiz İlan Ver
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-50 font-semibold py-2 rounded-lg transition-all duration-200"
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
                    <Button
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 rounded-lg transition-all duration-200"
                    >
                      Giriş / Üyelik
                    </Button>
                  </Link>
                  <Link href="/ilan-ekle">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      Ücretsiz İlan Ver
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}