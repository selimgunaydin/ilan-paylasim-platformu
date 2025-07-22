import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { listings } from '@shared/schemas'
import { eq, and, or, ilike, sql } from 'drizzle-orm'
import { getListingImagesUrls } from '../../../lib/r2';
import { validateAndNormalizeCity } from '../../../lib/constants';

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
    const city = searchParams.get('city') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Hem arama sorgusu hem de şehir parametresi boşsa hata döndür
    if (!searchQuery.trim() && !city.trim()) {
      return NextResponse.json({
        listings: [],
        total: 0,
        query: searchQuery,
        city: city
      }, { status: 200 })
    }

    // Şehir parametresini doğrula ve normalize et
    const cityParam = validateAndNormalizeCity(city);

    // Sorgu koşullarını oluştur
    const conditions: any[] = [
      eq(listings.approved, true),
      eq(listings.active, true)
    ]

    // Arama koşulu ekle
    if (searchQuery.trim()) {
      const searchCondition = createSearchCondition(searchQuery)
      conditions.push(searchCondition)
    }

    // Şehir koşulu ekle
    if (cityParam) {
      conditions.push(eq(listings.city, cityParam))
    }

    // Koşulları birleştir
    const whereClause = and(...conditions)
    
    // İlanları ve toplam sayıyı al
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(listings)
        .where(whereClause)
        .orderBy(sql`CASE WHEN listing_type = 'premium' THEN 1 ELSE 2 END`)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(whereClause)
    ])

    // İlan resimlerini URL'e çevir
    const listingsWithUrls = data.map(listing => ({
      ...listing,
      images: listing.images ? getListingImagesUrls(listing.images) : []
    }))

    return NextResponse.json({
      listings: listingsWithUrls,
      total: Number(countResult[0].count),
      query: searchQuery,
      city: city
    }, { status: 200 })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, message: 'Arama yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 