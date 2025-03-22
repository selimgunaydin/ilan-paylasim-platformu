import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { listings } from '@shared/schemas'
import { eq, and, or, ilike, sql } from 'drizzle-orm'
import { getListingImagesUrls } from '../../../lib/r2';

export const dynamic = 'force-dynamic';

// Arama koşulu oluşturan yardımcı fonksiyon
const createSearchCondition = (search: string) => {
  if (!search || search.trim() === '') {
    return sql`1=1`; // Her zaman true olan bir koşul
  }
  
  // Başlık ve açıklamada arama
  return or(
    ilike(listings.title, `%${search}%`),
    ilike(listings.description, `%${search}%`)
  );
}

export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Boş arama sorgusu kontrolü
    if (!searchQuery.trim()) {
      return NextResponse.json({
        listings: [],
        total: 0,
        query: searchQuery
      }, { status: 200 })
    }

    // Arama koşulunu oluştur
    const searchCondition = createSearchCondition(searchQuery)
    
    // İlanları ve toplam sayıyı al
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(listings)
        .where(
          and(
            searchCondition,
            eq(listings.approved, true),
            eq(listings.active, true)
          )
        )
        .orderBy(sql`CASE WHEN listing_type = 'premium' THEN 1 ELSE 2 END`)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(
          and(
            searchCondition,
            eq(listings.approved, true),
            eq(listings.active, true)
          )
        )
    ])

    // İlan resimlerini URL'e çevir
    const listingsWithUrls = data.map(listing => ({
      ...listing,
      images: listing.images ? getListingImagesUrls(listing.images) : []
    }))

    return NextResponse.json({
      listings: listingsWithUrls,
      total: Number(countResult[0].count),
      query: searchQuery
    }, { status: 200 })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, message: 'Arama yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 