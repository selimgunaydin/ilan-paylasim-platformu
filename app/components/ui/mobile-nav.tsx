'use client';

import { ListPlus, Star, Send, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectIncomingUnreadMessages, selectOutgoingUnreadMessages, fetchUnreadMessages } from "@/redux/slices/messageSlice";
import { Badge } from "./badge";
import { useSocket } from "@/providers/socket-provider";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function MobileNav() {
  // Redux state'ten okunmamış mesaj sayılarını al
  const incomingUnreadMessages = useAppSelector(selectIncomingUnreadMessages);
  const outgoingUnreadMessages = useAppSelector(selectOutgoingUnreadMessages);
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const user = session?.user;

  // Mobil menüde de Socket.IO bildirimlerini dinle
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
      <div className="flex items-center justify-between w-full">
        <Link href="/ilanlarim" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-4 px-0.5">
            <ListPlus className="h-6 w-6" />
            <span className="text-[10px] truncate mt-0.5">İlanlarım</span>
          </div>
        </Link>
        <Link href="/favorilerim" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-4 px-0.5">
            <Star className="h-6 w-6" />
            <span className="text-[10px] truncate mt-0.5">Favorilerim</span>
          </div>
        </Link>
        <Link href="/gonderilen-mesajlar" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-4 px-0.5 relative">
            <div className="relative">
            <Send className="h-6 w-6" />
            {outgoingUnreadMessages > 0 && (
              <Badge variant="destructive" className="absolute -top-4 -right-6 h-5 w-5 p-0 flex items-center justify-center text-[8px]">
                {outgoingUnreadMessages > 99 ? '99+' : outgoingUnreadMessages}
              </Badge>
            )}
            </div>
            <span className="text-[10px] truncate mt-0.5">Gönderilen</span>

          </div>
        </Link>
        <Link href="/gelen-mesajlar" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-4 px-0.5 relative">
            <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {incomingUnreadMessages > 0 && (
              <Badge variant="destructive" className="absolute -top-4 -right-6 h-5 w-5 p-0 flex items-center justify-center text-[8px]">
                {incomingUnreadMessages > 99 ? '99+' : incomingUnreadMessages}
              </Badge>
            )}
            </div>
            <span className="text-[10px] truncate mt-0.5">Gelen</span>

          </div>
        </Link>
        <Link href="/profilim" className="flex-1 min-w-0">
          <div className="flex flex-col items-center py-4 px-0.5">
            <User className="h-6 w-6" />
            <span className="text-[10px] truncate mt-0.5">Profilim</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
