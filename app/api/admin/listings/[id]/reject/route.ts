import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../../server/db';
import { listings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Admin yetkilendirme kontrolü fonksiyonu
import { checkAdminAuth } from '@/utils/check-admin';

// İlan reddetme API'si
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

    // İlanı bul ve güncelle
    const [updatedListing] = await db
      .update(listings)
      .set({ active: false, approved: false })
      .where(eq(listings.id, listingId))
      .returning();

    if (!updatedListing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error("İlan reddetme hatası:", error);
    return NextResponse.json(
      { error: "İlan reddedilemedi" },
      { status: 500 }
    );
  }
} 