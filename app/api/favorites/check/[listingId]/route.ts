import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { favorites } from '@shared/schemas';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

// Belirli bir ilanın favori olup olmadığını kontrol eden API
export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = parseInt(params.listingId);
    
    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Geçersiz ilan ID'si" },
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
        { isFavorite: false },
        { status: 200 }
      );
    }

    // userId'yi al
    const userId = Number(token.sub);;

    // Favori kaydını kontrol et
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.listingId, listingId)
        )
      );

    // Favorilerde var mı?
    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return NextResponse.json(
      { error: "Favori durumu kontrol edilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 