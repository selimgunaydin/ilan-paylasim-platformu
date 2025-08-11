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
  Mail,
  KeyRound,
  FileText,
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
    label: "Şikayetler",
    path: "/yonetim/sikayetler",
    icon: ClipboardList,
  },
  {
    label: "Mesajlar",
    path: "/yonetim/tummesajlar",
    icon: MessageSquare,
  },
  {
    label: "İletişim Mesajları",
    path: "/yonetim/iletisim-mesajlari",
    icon: Mail,
  },
  {
    label: "Blog",
    path: "/yonetim/blog",
    icon: FileText,
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
  {
    label: "Site Ayarları",
    path: "/yonetim/ayarlar/site",
    icon: Settings,
  },
  {
    label: "Admin Pin Değiştir",
    path: "/yonetim/admin-pin-degistir",
    icon: KeyRound,
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