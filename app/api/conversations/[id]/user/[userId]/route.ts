import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { conversations, users } from '@shared/schemas'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    // Konuşma ve kullanıcı ID'lerini al ve doğrula
    const conversationId = parseInt(params.id)
    const targetUserId = parseInt(params.userId)
    
    if (isNaN(conversationId) || isNaN(targetUserId)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 })
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

 
    // Giriş yapan kullanıcının ID'sini al
    const userId = Number(token.sub);;

    // Konuşmayı kontrol et
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    // Konuşma bulunamadıysa
    if (!conversation) {
      return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu konuşmaya erişim yetkisi var mı kontrol et
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json({ error: "Bu konuşmaya erişim yetkiniz yok" }, { status: 403 })
    }

    // Hedef kullanıcı bu konuşmanın bir parçası mı kontrol et
    if (conversation.senderId !== targetUserId && conversation.receiverId !== targetUserId) {
      return NextResponse.json({ error: "Kullanıcı bu konuşmanın bir parçası değil" }, { status: 400 })
    }

    // Kullanıcı bilgilerini getir
    const userInfo = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        lastSeen: true,
        yuksekUye: true,
        gender: true,
        city: true,
        aboutMe: true
      }
    });

    if (!userInfo) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(userInfo);
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Kullanıcı bilgileri getirilemedi" }, { status: 500 })
  }
} 