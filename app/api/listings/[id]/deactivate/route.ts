import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

// İlan deaktive etme API'si
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Geçersiz ilan ID" },
        { status: 400 }
      );
    }

    // İlanı bul
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!listing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcı sadece kendi ilanını deaktive edebilir
    if (listing.userId !== parseInt(token.sub!)) {
      return NextResponse.json(
        { error: "Bu ilanı deaktive etme yetkiniz yok" },
        { status: 403 }
      );
    }

    // İlanı deaktive et
    const [updatedListing] = await db
      .update(listings)
      .set({ active: false })
      .where(eq(listings.id, listingId))
      .returning();

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error("İlan deaktive etme hatası:", error);
    return NextResponse.json(
      { error: "İlan deaktive edilemedi" },
      { status: 500 }
    );
  }
} 