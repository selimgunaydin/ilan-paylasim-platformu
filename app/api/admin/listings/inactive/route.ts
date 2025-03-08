import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../server/db';
import { listings, categories } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Admin yetkilendirme kontrolü fonksiyonu
import { checkAdminAuth } from '@/utils/check-admin';

// Pasif ilanları getirme API'si
export async function GET(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    const inactiveListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        createdAt: listings.createdAt,
        endDate: listings.expiresAt,
        viewCount: listings.views,
        city: listings.city,
        listingType: listings.listingType,
        categoryName: categories.name,
        active: listings.active,
        approved: listings.approved,
      })
      .from(listings)
      .leftJoin(
        categories,
        eq(listings.categoryId, categories.id)
      )
      .where(eq(listings.active, false))
      .orderBy(desc(listings.createdAt));

    return NextResponse.json(inactiveListings);
  } catch (error) {
    console.error("Pasif ilanları getirme hatası:", error);
    return NextResponse.json(
      { error: "İlanlar yüklenemedi" },
      { status: 500 }
    );
  }
} 