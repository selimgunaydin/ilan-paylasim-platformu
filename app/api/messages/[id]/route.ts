import { NextRequest, NextResponse } from "next/server";
import { db } from '../../../../server/db';
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { messages } from '../../../../shared/schema';
import { getToken } from "next-auth/jwt";

interface JwtPayload {
  userId: number;
}

export async function DELETE(
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
        { success: false, message: "Lütfen giriş yapınız" },
        { status: 401 }
      );
    }

    const userId = Number(token.sub);
    
    // ID'yi kontrol et
    const messageId = parseInt(params.id);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { success: false, message: "Geçersiz mesaj ID'si" },
        { status: 400 }
      );
    }

    // İlgili mesajı al
    const messageToDelete = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    // Mesaj yoksa hata döndür
    if (!messageToDelete) {
      return NextResponse.json(
        { success: false, message: "Mesaj bulunamadı" },
        { status: 404 }
      );
    }

    // Mesajı silme yetkisi var mı kontrol et
    if (messageToDelete.senderId !== userId) {
      return NextResponse.json(
        { success: false, message: "Bu mesajı silme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Mesajı sil
    await db.delete(messages).where(eq(messages.id, messageId));

    return NextResponse.json({ success: true, message: "Mesaj başarıyla silindi" });
  } catch (error) {
    console.error("Mesaj silme hatası:", error);
    return NextResponse.json(
      { success: false, message: "Bir hata oluştu" },
      { status: 500 }
    );
  }
} 