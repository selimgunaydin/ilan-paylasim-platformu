import { NextRequest, NextResponse } from "next/server";
import { db } from '../../../../../server/db';
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { messages } from '../../../../../shared/schema';
import { getToken } from "next-auth/jwt";

interface JwtPayload {
  userId: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth token kontrolü
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }



    const userId = Number(token.sub);
    
    // ID'yi kontrol et
    const messageId = parseInt(params.id);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: "Geçersiz mesaj ID" },
        { status: 400 }
      );
    }

    // İlgili mesajı al
    const [message] = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        isRead: messages.isRead
      })
      .from(messages)
      .where(eq(messages.id, messageId));

    // Mesaj yoksa hata döndür
    if (!message) {
      return NextResponse.json(
        { error: "Mesaj bulunamadı" },
        { status: 404 }
      );
    }

    // Mesajı okundu olarak işaretleme yetkisi var mı kontrol et
    if (message.receiverId !== userId) {
      return NextResponse.json(
        { error: "Bu mesajı okundu olarak işaretleme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Mesaj zaten okundu olarak işaretlendiyse
    if (message.isRead) {
      return NextResponse.json(message);
    }

    // Mesajı okundu olarak işaretle
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Mesaj okundu hatası:", error);
    return NextResponse.json(
      { error: "Mesaj okundu olarak işaretlenemedi" },
      { status: 500 }
    );
  }
} 