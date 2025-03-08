import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../server/db';
import { listings, categories } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sql } from 'drizzle-orm';

// Admin yetkilendirme kontrolü fonksiyonu
import { checkAdminAuth } from '@/utils/check-admin';

// Bekleyen ilanları getirme API'si
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

    const pendingCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(
        and(
          eq(listings.approved, false),
          eq(listings.active, true)
        )
      );

    const pendingListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        createdAt: listings.createdAt,
        listingType: listings.listingType,
        categoryName: categories.name,
        categoryId: listings.categoryId,
      })
      .from(listings)
      .leftJoin(
        categories,
        eq(listings.categoryId, categories.id)
      )
      .where(
        and(
          eq(listings.approved, false),
          eq(listings.active, true)
        )
      )
      .orderBy(asc(listings.createdAt));

    return NextResponse.json(pendingListings);
  } catch (error) {
    console.error("Bekleyen ilanları getirme hatası:", error);
    return NextResponse.json(
      { error: "İlanlar yüklenemedi" },
      { status: 500 }
    );
  }
} 