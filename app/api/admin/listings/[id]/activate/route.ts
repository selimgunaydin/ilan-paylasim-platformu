import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Admin yetkilendirme kontrolü fonksiyonu
import { checkAdminAuth } from '@/utils/check-admin';

// İlan aktifleştirme API'si
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

    // İlanı bul ve aktifleştir
    const [updatedListing] = await db
      .update(listings)
      .set({
        active: true,
        approved: true // İlan aktif edilirken aynı zamanda onaylanmalı
      })
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
    console.error("İlan aktifleştirme hatası:", error);
    return NextResponse.json(
      { error: "İlan aktif edilemedi" },
      { status: 500 }
    );
  }
} 