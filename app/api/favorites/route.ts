import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { listings, favorites, categories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
// Favori ilanları getirme API'si
export async function GET(request: NextRequest) {
  try {
    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Oturum açılmamış' },
        { status: 401 }
      );
    }

    // userId'yi al
    const userId = Number(token.sub);;

    // Kullanıcının favori ilanlarını veritabanından al
    const userFavorites = await db
      .select({
        listing: listings,
        category: categories,
      })
      .from(favorites)
      .innerJoin(
        listings,
        eq(favorites.listingId, listings.id),
      )
      .leftJoin(
        categories,
        eq(listings.categoryId, categories.id),
      )
      .where(eq(favorites.userId, userId));

    // İlan listesini oluştur ve kategori bilgisini ekle
    const favoriteListings = userFavorites.map((f) => ({
      ...f.listing,
      category: f.category,
      // İlan resimlerini URL'e dönüştür
      images: f.listing.images ? f.listing.images.map(img => `/images/${img}`) : [],
    }));

    return NextResponse.json(favoriteListings, { status: 200 });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Favori ilanlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Favori ekleme API'si
export async function POST(request: NextRequest) {
  try {
    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Oturum açılmamış' },
        { status: 401 }
      );
    }

    // userId'yi al
    const userId = Number(token.sub);;

    // Request body'den listingId'yi al
    const body = await request.json();
    const { listingId } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, message: 'İlan ID gereklidir' },
        { status: 400 }
      );
    }

    // İlanın var olup olmadığını kontrol et
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      );
    }

    // Favori zaten var mı kontrol et
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.listingId, listingId)
      ));

    if (existingFavorite) {
      // Favori zaten eklenmiş, silme işlemi yap
      await db
        .delete(favorites)
        .where(and(
          eq(favorites.userId, userId),
          eq(favorites.listingId, listingId)
        ));

      return NextResponse.json(
        { success: true, message: 'Favori kaldırıldı', isFavorite: false },
        { status: 200 }
      );
    } else {
      // Yeni favori ekle
      await db
        .insert(favorites)
        .values({
          userId,
          listingId,
          createdAt: new Date(),
        });

      return NextResponse.json(
        { success: true, message: 'Favori eklendi', isFavorite: true },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json(
      { success: false, message: 'Favori işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 