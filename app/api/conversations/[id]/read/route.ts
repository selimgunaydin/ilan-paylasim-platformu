import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db';
import { conversations, messages } from '@/schemas/schema'
import { eq, and } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getToken } from 'next-auth/jwt';
export async function PATCH(
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

    // Konuşmayı bul
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });
    }

    // Kullanıcının bu konuşmaya erişim yetkisi var mı kontrol et
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json(
        { error: "Bu konuşmaya erişim yetkiniz yok" },
        { status: 403 }
      );
    }

    // Kullanıcının alıcı olduğu ve okunmamış tüm mesajları okundu olarak işaretle
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return NextResponse.json(
      { error: "Konuşma okundu olarak işaretlenemedi" },
      { status: 500 }
    );
  }
} 