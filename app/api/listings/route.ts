import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { listings, categories, users } from '@shared/schemas'
import { eq, and, inArray, or, ilike, sql, SQL } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '@/lib/storage';
import { getToken } from 'next-auth/jwt';
import { r2Client } from '../../lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getListingImageUrl, getListingImagesUrls } from '../../lib/r2';

export const dynamic = 'force-dynamic';

import { validateAndNormalizeCity } from '../../lib/constants';

// Arama koşulu oluşturan yardımcı fonksiyon
const createSearchCondition = (search: string): SQL<unknown> => {
  if (!search || search.trim() === '') {
    return sql`1=1`; // Her zaman true olan bir koşul
  }
  
  // or() fonksiyonu undefined dönme ihtimaline karşı güvenli bir şekilde işlem yap
  const searchCondition = or(
    ilike(listings.title, `%${search}%`),
    ilike(listings.description, `%${search}%`)
  );
  
  // Eğer searchCondition undefined ise varsayılan bir koşul döndür
  return searchCondition ?? sql`1=1`;
}

// R2 bucket tanımlaması
const LISTING_BUCKET = "seriilan";

// İlanları getirme API'si
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('categorySlug')
    const categoryId = searchParams.get('categoryId')
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Kategori slug ile filtreleme yapılıyorsa
    if (categorySlug) {
      // Önce slug'a göre kategoriyi bul
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .then(rows => rows[0])

      // Kategori bulunamadıysa boş sonuç döndür
      if (!category) {
        return NextResponse.json({ listings: [], total: 0 }, { status: 200 })
      }

      // Şehir parametresini doğrula ve normalize et
      const cityParam = validateAndNormalizeCity(city || '');

      // Ana kategori ise alt kategorileri de dahil et
      let categoryIds: number[] = [category.id]
      if (category.parentId === null) {
        const subCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.parentId, category.id))
        
        if (subCategories.length > 0) {
          categoryIds = [...categoryIds, ...subCategories.map(c => c.id)]
        }
      }

      // Sorgu koşullarını oluştur
      const conditions: SQL<unknown>[] = [
        inArray(listings.categoryId, categoryIds),
        eq(listings.approved, true),
        eq(listings.active, true)
      ]

      // Şehir filtresi ekle
      if (cityParam) {
        conditions.push(eq(listings.city, cityParam))
      }

      // Arama filtresi ekle
      if (search) {
        conditions.push(createSearchCondition(search))
      }

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
        total: Number(countResult[0].count)
      }, { status: 200 })
    }
    
    // Kategori ID ile filtreleme yapılıyorsa
    if (categoryId) {
      const catId = parseInt(categoryId)
      if (isNaN(catId)) {
        return NextResponse.json({ listings: [], total: 0 }, { status: 200 })
      }

      // Ana kategori mi kontrol et
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.id, catId))
        .then(rows => rows[0])

      if (!category) {
        return NextResponse.json({ listings: [], total: 0 }, { status: 200 })
      }

      // Ana kategori ise alt kategorileri de dahil et
      let categoryIds: number[] = [catId]
      if (category.parentId === null) {
        const subCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.parentId, catId))
        
        if (subCategories.length > 0) {
          categoryIds = [...categoryIds, ...subCategories.map(c => c.id)]
        }
      }

      // Sorgu koşullarını oluştur
      const conditions: SQL<unknown>[] = [
        inArray(listings.categoryId, categoryIds),
        eq(listings.approved, true),
        eq(listings.active, true)
      ]

      // Arama filtresi ekle
      if (search) {
        conditions.push(createSearchCondition(search))
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
        total: Number(countResult[0].count)
      }, { status: 200 })
    }
    
    // Hiçbir filtreleme yoksa tüm aktif ve onaylı ilanları getir
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(listings)
        .where(
          and(
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
      total: Number(countResult[0].count)
    }, { status: 200 })
  } catch (error) {
    console.error('Listings fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'İlanlar alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni ilan oluşturma API'si
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
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // userId'yi al
    const userId = Number(token.sub);

    // Request body'den ilan bilgilerini al
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const city = formData.get('city') as string;
    const categoryId = formData.get('categoryId') as string;
    const contactPerson = formData.get('contactPerson') as string || '';
    const phone = formData.get('phone') as string || '';
    const listingType = formData.get('listingType') as string || 'standard';
    const files = formData.getAll('images') as File[];

    // Ücretsiz ilan hakkı kontrolü
    if (listingType === 'standard') {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (user?.has_used_free_ad) {
        return NextResponse.json(
          { success: false, message: 'Ücretsiz ilan hakkınızı zaten kullandınız. Sadece premium ilan verebilirsiniz.' },
          { status: 403 }
        );
      }
    }

    // Zorunlu alanları kontrol et
    if (!title || !description || !city || !categoryId) {
      return NextResponse.json(
        { success: false, message: 'Başlık, açıklama, şehir ve kategori zorunludur' },
        { status: 400 }
      );
    }

    // Resim dosyaları için geçerlilik kontrolü
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_FILE_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
      ];

      for (const file of files) {
        // Dosya boyutu kontrolü
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { success: false, message: 'Dosya boyutu en fazla 5MB olabilir' },
            { status: 400 }
          );
        }

        // Dosya türü kontrolü
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json(
            { success: false, message: 'Sadece JPEG, PNG, WEBP ve GIF formatları desteklenir' },
            { status: 400 }
          );
        }
      }
    }

    // Görüntüleri R2'ye kaydet
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        for (const file of files) {
          // Dosyayı işle
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          
          // Resmi optimize et (WebP'ye dönüştür)
          const optimizedImage = await sharp(fileBuffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          
          // Dosya adını oluştur
          const timestamp = Date.now();
          const random = uuidv4().slice(0, 8);
          const fileName = `listings/listing_${timestamp}_${random}.webp`;
          
          // R2'ye yükle
          await r2Client.send(
            new PutObjectCommand({
              Bucket: LISTING_BUCKET,
              Key: fileName,
              Body: optimizedImage,
              ContentType: 'image/webp',
              ACL: "public-read",
            })
          );
          
          // Dosya yolunu kaydet
          imageUrls.push(fileName);
        }
      } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        return NextResponse.json(
          { success: false, message: 'Resim yüklenirken bir hata oluştu' },
          { status: 500 }
        );
      }
    }

    // IP adresini al - NextJS'te doğrudan erişilemez, sadece placeholder
    const user_ip = "0.0.0.0";

    // İlanı oluştur
    const listing = await storage.createListing({
      title,
      description,
      city,
      categoryId: Number(categoryId),
      listingType: listingType || "standard",
      contactPerson: contactPerson || "",
      phone: phone || "",
      userId,
      images: imageUrls,
      paymentStatus: null,
      approved: false,
      views: 0,
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
      user_ip,
      updated_at: new Date(),
    });

    // Ücretsiz ilan kullanıldıysa kullanıcıyı güncelle
    if (listingType === 'standard') {
      await db.update(users).set({ has_used_free_ad: true }).where(eq(users.id, userId));
    }

    // İlan oluşturuldu bilgisini logla
    console.log(`Yeni ilan oluşturuldu: ${listing.id}, kullanıcı: ${userId} (Tip: ${listingType})`);
    
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("İlan oluşturma hatası:", error);
    return NextResponse.json(
      { success: false, message: 'İlan oluşturulamadı' },
      { status: 500 }
    );
  }
} 