import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { conversations } from '@shared/schemas'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { storage } from '@/lib/storage';
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

    // Since parametresini URL'den al
    const { searchParams } = new URL(request.url)
    const since = new Date(searchParams.get('since') || new Date().toISOString())

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

    // Mesaj olaylarını getir
    const events = await storage.getMessageEvents(conversationId, since);
    
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching message events:", error);
    return NextResponse.json(
      { error: "Mesaj olayları alınamadı" },
      { status: 500 }
    );
  }
} 