import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '../../../../server/db'
import { conversations, messages, users, listings } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getToken } from 'next-auth/jwt'

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
    const userId = Number(token.sub);

    // Konuşmayı detaylı bilgilerle birlikte getir
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        listing: true
      }
    });

    // Konuşma bulunamadıysa
    if (!conversation) {
      return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu konuşmayı görüntüleme yetkisi var mı kontrol et
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json({ error: "Bu konuşmaya erişim yetkiniz yok" }, { status: 403 })
    }

    // Karşı kullanıcının bilgilerini getir
    const otherUserId = conversation.senderId === userId ? conversation.receiverId : conversation.senderId;
    const otherUser = await db.query.users.findFirst({
      where: eq(users.id, otherUserId),
      columns: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        lastSeen: true
      }
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

    return NextResponse.json({
      ...conversation,
      otherUser
    });
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Konuşma getirilemedi" }, { status: 500 })
  }
}

export async function DELETE(
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
      .select({
        id: conversations.id,
        senderId: conversations.senderId,
        receiverId: conversations.receiverId,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))

    // Konuşma bulunamadıysa
    if (!conversation) {
      return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu konuşmayı silme yetkisi var mı kontrol et
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json({ error: "Bu konuşmayı silme yetkiniz yok" }, { status: 403 })
    }

    // Konuşmaya ait tüm mesajları sil
    await db
      .delete(messages)
      .where(eq(messages.conversationId, conversationId))

    // Konuşmayı sil
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Konuşma silinemedi" }, { status: 500 })
  }
} 