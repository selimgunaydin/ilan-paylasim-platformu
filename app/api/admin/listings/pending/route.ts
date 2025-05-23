import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings, categories } from '@shared/schemas';
import { eq, and, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sql } from 'drizzle-orm';

// Bekleyen ilanları getirme API'si
export async function GET() {
  try {

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