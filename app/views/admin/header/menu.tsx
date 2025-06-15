"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@app/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/utils";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, Menu, Settings, KeyRound } from "lucide-react";

type MenuItem = {
  label: string;
  path: string;
  icon: any; // Lucide icon türü
};

type AdminHeaderClientProps = {
  menuItems: MenuItem[];
  settingsMenuItems: MenuItem[];
};

export function AdminHeaderClient({
  menuItems,
  settingsMenuItems,
}: AdminHeaderClientProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession(); //session a data ve status bilgilerini al

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/yonetim");
  };

  if (status === "unauthenticated" || status === "loading") {
    return null;
  }

  const MenuContent = () => (
    <div className="flex items-center gap-2">
      {menuItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <Button
            variant={pathname === item.path ? "default" : "ghost"}
            className={cn("flex items-center gap-2")}
          >
            <item.icon className="w-4 h-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        </Link>
      ))}
      {/* Ayarlar Dropdown Menüsü */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Ayarlar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {settingsMenuItems.map((item) => (
            <DropdownMenuItem key={item.path} asChild> 
            {/* asChild eklendi w-full eklendi.  */}
              <Link href={item.path} className="flex items-center w-full">
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link href="/yonetim/admin-pin-degistir" className="flex items-center w-full">
              <KeyRound className="w-4 h-4 mr-2" />
              Admin PIN Değiştir
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {/* Mobil Menü Butonu */}
      <div className="lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
            <div className="flex flex-col h-full">
              <div className="flex-grow overflow-y-auto">
                <nav className="flex flex-col gap-2 mt-4">
                  {menuItems.map((item) => (
                    <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant={pathname === item.path ? "default" : "ghost"}
                        className={cn("w-full justify-start")}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  {/* Mobil Ayarlar Menüsü */}
                  {settingsMenuItems.map((item) => (
                    <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant={pathname === item.path ? "default" : "ghost"}
                        className={cn("w-full justify-start")}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="mt-auto">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Masaüstü Menü */}
      <div className="hidden lg:flex items-center gap-4">
        <MenuContent />
        <Button variant="destructive" onClick={handleLogout} className="ml-4">
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </>
  );
}