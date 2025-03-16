
import { ListPlus, Star, Send, MessageCircle, User } from "lucide-react";
import Link from "next/link";

export function MobileNav() {

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
      <div className="flex items-center justify-between w-full">
        <Link href="/ilanlarim" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-1.5 px-0.5">
            <ListPlus className="h-4 w-4" />
            <span className="text-[10px] truncate mt-0.5">İlanlarım</span>
          </div>
        </Link>
        <Link href="/favorilerim" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-1.5 px-0.5">
            <Star className="h-4 w-4" />
            <span className="text-[10px] truncate mt-0.5">Favorilerim</span>
          </div>
        </Link>
        <Link href="/gonderilen-mesajlar" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-1.5 px-0.5">
            <Send className="h-4 w-4" />
            <span className="text-[10px] truncate mt-0.5">Gönderilen</span>
          </div>
        </Link>
        <Link href="/gelen-mesajlar" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-1.5 px-0.5">
            <MessageCircle className="h-4 w-4" />
            <span className="text-[10px] truncate mt-0.5">Gelen</span>
          </div>
        </Link>
        <Link href="/profilim" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-1.5 px-0.5">
            <User className="h-4 w-4" />
            <span className="text-[10px] truncate mt-0.5">Profilim</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
