import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages, users } from '@/schemas/schema';
import { eq, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { checkAdminAuth } from '@/utils/check-admin';

// Admin konuşma mesajları getirme API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    const conversationId = parseInt(params.id);
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Geçersiz konuşma ID" },
        { status: 400 }
      );
    }

    // Konuşmayı kontrol et
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      return NextResponse.json(
        { error: "Konuşma bulunamadı" },
        { status: 404 }
      );
    }

    // Mesajları getir
    const messageList = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        createdAt: messages.createdAt,
        isRead: messages.isRead,
        files: messages.files,
        fileTypes: messages.fileTypes,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    // Gönderen ve alıcı bilgilerini al
    const [sender] = await db
      .select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        gender: users.gender,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, conversation.senderId));

    const [receiver] = await db
      .select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        gender: users.gender,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, conversation.receiverId));

    return NextResponse.json({
      conversation,
      messages: messageList,
      sender,
      receiver
    });
  } catch (error) {
    console.error("Konuşma mesajları getirme hatası:", error);
    return NextResponse.json(
      { error: "Mesajlar alınamadı" },
      { status: 500 }
    );
  }
} 