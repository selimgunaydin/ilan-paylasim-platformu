import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db';
import { conversations, messages } from '@shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getToken } from 'next-auth/jwt';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Konuşma ID'sini al ve doğrula
    const conversationId = parseInt(params.id)
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Geçersiz konuşma ID" }, { status: 400 })
    }

    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

 
    // userId'yi al
    const userId = Number(token.sub);;

    // Konuşmayı kontrol et
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    // Konuşma bulunamadıysa
    if (!conversation) {
      return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu konuşmayı görüntüleme yetkisi var mı kontrol et
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json({ error: "Bu konuşmaya erişim yetkiniz yok" }, { status: 403 })
    }

    // Konuşmaya ait mesajları getir
    const messagesList = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
    });

    // Konuşmanın okundu olarak işaretlenmesi
    if (conversation.receiverId === userId) {
      // Bu konuşmadaki tüm mesajları okundu olarak işaretle
      await db
        .update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        ));
    }

    return NextResponse.json(messagesList);
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Mesajlar getirilemedi" }, { status: 500 })
  }
} 