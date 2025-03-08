'use client'
import { Button } from "./button";
import { 
  Home, 
  Users, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu,
  AlertTriangle,
  ListChecks,
  PowerOff,
  MessageSquare,
  Cog,
  FolderTree // Kategoriler için yeni ikon
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@app/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// Admin Header bileşeni - Yönetim paneli için özel header
export function AdminHeader() {
  const { data: session } = useSession();
  const admin = session?.user?.type === 'admin' ? session.user : null;
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Eğer admin oturumu yoksa, header'ı gösterme
  if (!admin) {
    return null;
  }

  // Menü öğelerinin merkezi yönetimi için array
  const menuItems = [
    { 
      label: "Anasayfa", 
      path: "/yonetim/anasayfa", 
      icon: Home 
    },
    { 
      label: "Üyeler", 
      path: "/yonetim/users", 
      icon: Users 
    },
    { 
      label: "Onay", 
      path: "/yonetim/onaybekleyenilanlar", 
      icon: AlertTriangle 
    },
    { 
      label: "Aktif", 
      path: "/yonetim/aktifilanlar", 
      icon: ListChecks 
    },
    { 
      label: "Pasif", 
      path: "/yonetim/pasifilanlar", 
      icon: PowerOff 
    },
    { 
      label: "Mesajlar", 
      path: "/yonetim/tummesajlar", 
      icon: MessageSquare 
    },
    { 
      label: "Kategoriler", 
      path: "/yonetim/kategoriler", 
      icon: FolderTree 
    }
  ];

  // Ayarlar alt menü öğeleri
  const settingsMenuItems = [
    {
      label: "Ticari Ayarlar",
      path: "/yonetim/ayarlar/ticari",
      icon: Cog
    }
  ];

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/yonetim');
  };

  const MenuContent = () => (
    <div className="flex items-center gap-2">
      {menuItems.map((item) => (
        <Button
          key={item.path}
          variant={window.location.pathname === item.path ? "default" : "ghost"}
          className={cn(
            "flex items-center gap-2",
            window.location.pathname === item.path ? "bg-primary text-white" : ""
          )}
          onClick={() => navigateTo(item.path)}
        >
          <item.icon className="w-4 h-4" />
          <span className="hidden md:inline">{item.label}</span>
        </Button>
      ))}
      {/* Ayarlar Dropdown Menüsü */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Ayarlar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {settingsMenuItems.map((item) => (
            <DropdownMenuItem
              key={item.path}
              onClick={() => navigateTo(item.path)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo ve Başlık */}
          <div className="flex items-center gap-4">
            <h1 
              className="text-xl font-bold text-primary cursor-pointer"
              onClick={() => navigateTo("/yonetim/anasayfa")}
            >
              Admin Panel
            </h1>
          </div>

          {/* Mobil Menü Butonu */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-2 mt-4">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={window.location.pathname === item.path ? "default" : "ghost"}
                      className={cn(
                        "justify-start",
                        window.location.pathname === item.path ? "bg-primary text-white" : ""
                      )}
                      onClick={() => navigateTo(item.path)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                  {/* Mobil Ayarlar Menüsü */}
                  {settingsMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={window.location.pathname === item.path ? "default" : "ghost"}
                      className={cn(
                        "justify-start",
                        window.location.pathname === item.path ? "bg-primary text-white" : ""
                      )}
                      onClick={() => navigateTo(item.path)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="justify-start mt-4"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Masaüstü Menü */}
          <div className="hidden lg:flex items-center gap-4">
            <MenuContent />
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="ml-4"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}