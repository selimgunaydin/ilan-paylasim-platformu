"use client";

import { Button } from "../../../components/ui/button";
import {
  Menu,
  X,
  ListPlus,
  Star,
  Send,
  MessageCircle,
  User,
  Home,
  Search,
  Mail,
  FileText,
  MessageSquare,
  Users,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react"; // Added useRef
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  fetchUnreadMessages,
  selectIncomingUnreadMessages,
  selectOutgoingUnreadMessages,
} from "../../../redux/slices/messageSlice";
import { Badge } from "../../../components/ui/badge";
import { useSocket } from "@/providers/socket-provider";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "../../../hooks/use-on-click-outside"; // Import the hook

interface MenuItem {
  label: string;
  icon: any;
  path: string;
  unreadCount?: number;
  name: string;
  href: string;
  loggedIn: boolean | null;
}

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown

  const incomingUnreadMessages = useAppSelector(selectIncomingUnreadMessages);
  const outgoingUnreadMessages = useAppSelector(selectOutgoingUnreadMessages);
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();

  // Use the hook to close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => {
    setIsProfileDropdownOpen(false);
  });

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

    socket.on("messageNotification", handleMessageNotification);
    socket.on("newConversation", handleMessageNotification);

    return () => {
      socket.off("messageNotification", handleMessageNotification);
      socket.off("newConversation", handleMessageNotification);
    };
  }, [socket, isConnected, dispatch, user]);

  const generalMenuItems: MenuItem[] = [
    {
      label: "Kurumsal",
      icon: Users,
      path: "/kurumsal",
      name: "Kurumsal",
      href: "/kurumsal",
      loggedIn: null,
    },
    {
      label: "Sözleşmeler",
      icon: FileText,
      path: "/sozlesmeler",
      name: "Sözleşmeler",
      href: "/sozlesmeler",
      loggedIn: null,
    },
    {
      label: "İletişim",
      icon: MessageSquare,
      path: "/iletisim",
      name: "İletişim",
      href: "/iletisim",
      loggedIn: null,
    },
  ];

  const profileDropdownItems: MenuItem[] = [
    {
      label: "İlanlarım",
      icon: ListPlus,
      path: "/ilanlarim",
      name: "İlanlarım",
      href: "/ilanlarim",
      loggedIn: true,
    },
    {
      label: "Favorilerim",
      icon: Star,
      path: "/favorilerim",
      name: "Favorilerim",
      href: "/favorilerim",
      loggedIn: true,
    },
    {
      label: "Gelen Mesajlar",
      icon: MessageCircle,
      path: "/gelen-mesajlar",
      unreadCount: incomingUnreadMessages,
      name: "Gelen",
      href: "/gelen-mesajlar",
      loggedIn: true,
    },
    {
      label: "Gönderilen Mesajlar",
      icon: Send,
      path: "/gonderilen-mesajlar",
      unreadCount: outgoingUnreadMessages,
      name: "Gönderilen",
      href: "/gonderilen-mesajlar",
      loggedIn: true,
    },
    {
      label: "Profilim",
      icon: User,
      path: "/profilim",
      name: "Profilim",
      href: "/profilim",
      loggedIn: true,
    },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              İlan Platformu
            </h1>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors duration-300"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Ana Sayfa</span>
              </Link>
              {generalMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors duration-300",
                    pathname === item.path && "text-indigo-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300",
                      isProfileDropdownOpen && "bg-indigo-100 text-indigo-700"
                    )}
                  >
                    <User className="h-5 w-5" />
                    <span>Profil</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isProfileDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    <div
                      ref={dropdownRef} // Attach ref to the dropdown
                      className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg py-2 z-50 animate-in fade-in-0 slide-in-from-top-2"
                    >
                      {profileDropdownItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                          {item.unreadCount && item.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs font-bold">
                              {item.unreadCount}
                            </Badge>
                          )}
                        </Link>
                      ))}
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                        onClick={() => {
                          signOut({ redirect: false });
                          router.push("/");
                          setIsProfileDropdownOpen(false);
                        }}
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth">
                  <Button
                    variant="outline"
                    className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold py-2 px-6 rounded-full transition-all duration-300"
                  >
                    Giriş Yap
                  </Button>
                </Link>
              )}
              <Link href="/ilan-ekle">
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-600 transition-all duration-300">
                  Ücretsiz İlan Ver
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav
            className={cn(
              "absolute top-0 left-0 w-80 bg-white h-full shadow-2xl transform transition-transform duration-300 ease-in-out",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Menü</span>
                <button
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <Link
                href="/"
                className="flex items-center gap-3 py-3 px-4 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              >
                <Home className="h-5 w-5 text-indigo-600" />
                <span className="text-gray-800 font-medium">Ana Sayfa</span>
              </Link>
              <Link
                href="/kategoriler"
                className="flex items-center gap-3 py-3 px-4 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              >
                <Search className="h-5 w-5 text-indigo-600" />
                <span className="text-gray-800 font-medium">Kategoriler</span>
              </Link>
              {generalMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex items-center gap-3 py-3 px-4 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                >
                  <item.icon className="h-5 w-5 text-indigo-600" />
                  <span className="text-gray-800 font-medium">
                    {item.label}
                  </span>
                </Link>
              ))}

              <div className="border-t border-gray-200 my-2" />

              {user ? (
                <>
                  <div className="space-y-2">
                    {profileDropdownItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center justify-between py-3 px-4 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-indigo-600" />
                          <span className="text-gray-800 font-medium">
                            {item.label}
                          </span>
                        </div>
                        {item.unreadCount && item.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs font-bold">
                            {item.unreadCount}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link href="/ilan-ekle">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300">
                      Ücretsiz İlan Ver
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold py-3 rounded-lg transition-all duration-300"
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
                      className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold py-3 rounded-lg transition-all duration-300"
                    >
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/ilan-ekle">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300">
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
