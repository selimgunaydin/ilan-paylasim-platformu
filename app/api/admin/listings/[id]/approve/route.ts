import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings, users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Admin yetkilendirme kontrolü fonksiyonu
import { checkAdminAuth } from '@/utils/check-admin';

// İlan onaylama API'si
export async function PUT(
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

    // İlanı onayla
    await db
      .update(listings)
      .set({ approved: true })
      .where(eq(listings.id, listingId));

    // Eğer standart ilan onaylandıysa used_free_ad değerini 1 yap
    if (listing.listingType === "standard") {
      await db
        .update(users)
        .set({ used_free_ad: 1 })
        .where(eq(users.id, Number(listing.userId)));

      console.log(
        `Used free ad updated for user ${listing.userId} after approving standard listing ${listingId}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İlan onaylama hatası:", error);
    return NextResponse.json(
      { error: "İlan onaylanamadı" },
      { status: 500 }
    );
  }
} 