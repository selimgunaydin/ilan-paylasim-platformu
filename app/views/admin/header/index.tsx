// AdminHeader.tsx (Server Component)
import { Button } from "../../../components/ui/button";
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
  FolderTree,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@app/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import Link from "next/link";
import { AdminHeaderClient } from "./menu"; // Client component'i içe aktar

// Menü öğeleri (server-side'da tanımlı)
const menuItems = [
  {
    label: "Anasayfa",
    path: "/yonetim/anasayfa",
    icon: Home,
  },
  {
    label: "Üyeler",
    path: "/yonetim/users",
    icon: Users,
  },
  {
    label: "Onay",
    path: "/yonetim/onaybekleyenilanlar",
    icon: AlertTriangle,
  },
  {
    label: "Aktif",
    path: "/yonetim/aktifilanlar",
    icon: ListChecks,
  },
  {
    label: "Pasif",
    path: "/yonetim/pasifilanlar",
    icon: PowerOff,
  },
  {
    label: "Mesajlar",
    path: "/yonetim/tummesajlar",
    icon: MessageSquare,
  },
  {
    label: "Kategoriler",
    path: "/yonetim/kategoriler",
    icon: FolderTree,
  },
];

// Ayarlar alt menü öğeleri
const settingsMenuItems = [
  {
    label: "Ticari Ayarlar",
    path: "/yonetim/ayarlar/ticari",
    icon: Cog,
  },
];

// Server Component
export function AdminHeader() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo ve Başlık */}
          <div className="flex items-center gap-4">
            <Link href="/yonetim/anasayfa">
              <h1 className="text-xl font-bold text-primary cursor-pointer">
                Admin Panel
              </h1>
            </Link>
          </div>

          {/* Client Component */}
          <AdminHeaderClient
            menuItems={menuItems}
            settingsMenuItems={settingsMenuItems}
          />
        </div>
      </div>
    </header>
  );
}