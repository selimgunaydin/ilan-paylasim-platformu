import { NextRequest, NextResponse } from "next/server";
import { db } from '../../../../server/db';
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { conversations } from '@shared/schema';
import { getToken } from 'next-auth/jwt';
interface JwtPayload {
  userId: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/conversations/find başladı");
    
    // Tüm HTTP başlıklarını loglayalım
    const headers = Object.fromEntries(request.headers.entries());
    console.log("İstek başlıkları:", headers);
    
    // Headers'dan alıp cookie yöntemini de deneyelim
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('cookie');
    console.log("Cookie header:", cookieHeader);
    
    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Tüm çerezleri kontrol et
    const allCookies = request.cookies.getAll();
    console.log("Mevcut tüm çerezler:", allCookies.map(c => `${c.name}: ${c.value.substring(0, 10)}...`));
    
    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Oturum açılmamış' },
        { status: 401 }
      );
    }

    const userId = Number(token.sub);;
    
    // Request body'den verileri al
    const body = await request.json();
    const { listingId, receiverId } = body;
    console.log("İstek verileri:", { listingId, receiverId, userId });

    if (!listingId || !receiverId) {
      return NextResponse.json(
        { success: false, message: "Geçersiz istek. listingId ve receiverId gereklidir." },
        { status: 400 }
      );
    }

    // Mevcut konuşmayı bul
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.listingId, listingId),
        eq(conversations.senderId, userId),
        eq(conversations.receiverId, receiverId)
      ),
    });

    // Konuşma yoksa yeni bir konuşma oluştur
    if (!conversation) {
      console.log("Konuşma bulunamadı, yeni konuşma oluşturuluyor");
      const [newConversation] = await db.insert(conversations).values({
        listingId,
        senderId: userId,
        receiverId,
      }).returning();

      conversation = newConversation;
    } else {
      console.log("Mevcut konuşma bulundu:", conversation.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Konuşma bulundu veya oluşturuldu.", 
      conversation 
    });

  } catch (error) {
    console.error("Konuşma bulma hatası:", error);
    return NextResponse.json(
      { success: false, message: "Bir hata oluştu", error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
} 