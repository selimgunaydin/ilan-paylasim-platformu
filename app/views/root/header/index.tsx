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
import { cn } from "@/utils";
import { useOnClickOutside } from "../../../hooks/use-on-click-outside"; // Import the hook
import Image from "next/image";
import { SiteSettings } from "@shared/schemas";
import { Input } from "@app/components/ui/input";

interface MenuItem {
  label: string;
  icon: any;
  path: string;
  unreadCount?: number;
  name: string;
  href: string;
  loggedIn: boolean | null;
}

interface HeaderProps {
  settings: SiteSettings;
}

export function Header({ settings }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef(null);

  const incomingUnreadMessages = useAppSelector(selectIncomingUnreadMessages);
  const outgoingUnreadMessages = useAppSelector(selectOutgoingUnreadMessages);
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = "auto";
      }
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // Clear search query and errors when navigating to a new page
    if (searchQuery) {
        setSearchQuery('');
    }
    if (searchError) {
        setSearchError('');
    }
  }, [pathname]);

  useOnClickOutside([dropdownRef, buttonRef], () => {
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

  const handleMobileLinkClick = () => setIsMobileMenuOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 3) {
      setSearchError('Arama yapmak için en az 3 karakter girmelisiniz.');
      return;
    }
    setSearchError('');
    router.push(`/arama?q=${encodeURIComponent(searchQuery.trim())}`);
    // The input will be cleared by the useEffect watching the pathname
    setIsMobileMenuOpen(false); // Close mobile menu on search
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {settings?.site_logo ? (
              <Image
                src={settings.site_logo}
                alt={settings?.site_name || "İlan Platformu"}
                width={150}
                height={50}
                className="h-8 sm:h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : (
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                {settings?.site_name || "İlan Platformu"}
              </h1>
            )}
          </Link>

          {/* Search Input - Desktop */}
          <div className="hidden lg:flex flex-1 ms-24 mx-24">
            <form onSubmit={handleSearch} className="w-full flex items-center">
              <div className="relative w-full">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 3) {
                      setSearchError('');
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="İlanlarda ara..."
                  className={`w-full pr-10 focus:ring-indigo-500 focus:border-indigo-500 ${searchError && isFocused ? 'border-red-500' : ''}`}
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600"
                >
                  <Search className="h-5 w-5" />
                </button>
                {searchError && isFocused && (
                  <div className="absolute top-full mt-3 w-max bg-red-600 text-white text-xs rounded-md px-3 py-1.5 z-20 shadow-lg">
                    {searchError}
                    <div className="absolute bottom-full left-4 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-red-600"></div>
                  </div>
                )}
              </div>
            </form>
          </div>

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
          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors duration-300"
              >
                <Home className="h-5 w-5" />
                <span className="font-normal">Ana Sayfa</span>
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
                  <span className="font-normal">{item.label}</span>
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
                    ref={buttonRef}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-normal text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300",
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
              "absolute overflow-y-auto top-0 left-0 w-80 bg-white h-full shadow-2xl transform transition-transform duration-300 ease-in-out",
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

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="w-full flex items-center">
                <div className="relative w-full">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 3) {
                        setSearchError('');
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="İlanlarda ara..."
                    className={`w-full pr-10 focus:ring-indigo-500 focus:border-indigo-500 ${searchError && isFocused ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  {searchError && isFocused && (
                    <div className="absolute top-full mt-3 w-max bg-red-600 text-white text-xs rounded-md px-3 py-1.5 z-20 shadow-lg">
                      {searchError}
                      <div className="absolute bottom-full left-4 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-red-600"></div>
                    </div>
                  )}
                </div>
              </form>

              <Link
                href="/"
                className="flex items-center gap-3 py-3 px-4 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                onClick={handleMobileLinkClick}
              >
                <Home className="h-5 w-5 text-indigo-600" />
                <span className="text-gray-800 font-medium">Ana Sayfa</span>
              </Link>
              {generalMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex items-center gap-3 py-3 px-4 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                  onClick={handleMobileLinkClick}
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
                        onClick={handleMobileLinkClick}
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
                    <Button
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300"
                      onClick={handleMobileLinkClick}
                    >
                      Ücretsiz İlan Ver
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold py-3 rounded-lg transition-all duration-300"
                    onClick={() => {
                      signOut({ redirect: false });
                      router.push("/");
                      handleMobileLinkClick();
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
