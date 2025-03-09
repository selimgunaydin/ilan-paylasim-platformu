import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { favorites } from '@/schemas/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
// Favori ilanı silme API'si
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id);
    
    if (isNaN(listingId)) {
      return NextResponse.json(
        { success: false, message: "Geçersiz ilan ID'si" },
        { status: 400 }
      );
    }

    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Oturum açılmamış' },
        { status: 401 }
      );
    }

    // userId'yi al
    const userId = Number(token.sub);;

    // Favori kaydını sil
    const result = await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.listingId, listingId)
        )
      )
      .returning();

    // Silinen kayıt yoksa
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Favori bulunamadı veya zaten silinmiş' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Favori başarıyla silindi' },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { success: false, message: 'Favori silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 