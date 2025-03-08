import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '../../../server/db'
import { listings, categories } from '@shared/schema'
import { eq, and, inArray, or, ilike, sql, SQL } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '../../../server/storage'
import { getMessageFilesUrls } from '../../../server/services/r2'
import { getToken } from 'next-auth/jwt';
// Türkiye'deki tüm şehirlerin listesi
const turkishCities = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır",
  "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay",
  "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli",
  "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu",
  "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa",
  "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın",
  "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
]

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

      // Şehir parametresini kontrol et
      let cityParam: string | undefined = undefined
      if (city) {
        const normalizedCity = city.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
        
        cityParam = turkishCities.find(c => 
          c.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "") === normalizedCity
        )
      }

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
        images: listing.images ? listing.images.map(img => `/images/${img}`) : []
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
        images: listing.images ? listing.images.map(img => `/images/${img}`) : []
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
      images: listing.images ? listing.images.map(img => `/images/${img}`) : []
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
    const userId = Number(token.sub);;

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

    // Görüntüleri kaydet
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        // Burada dosyaların kaydedilmesi gerekiyor
        // NextJS App Router'da dosya yükleme işlemi için özel bir implementasyon yapmalıyız
        // Bu örnekte sadece dosya adlarını kaydediyoruz, gerçek uygulamada uygun depolama sistemine yüklenmelidir
        
        for (const file of files) {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${uuidv4()}.${fileExt}`;
          
          // Burada dosyayı depolama sistemine yükleme kodu olmalı
          // Örnek: await uploadToStorage(fileName, fileBuffer);
          
          // Şimdilik sadece dosya adını ekliyoruz
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
    });

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