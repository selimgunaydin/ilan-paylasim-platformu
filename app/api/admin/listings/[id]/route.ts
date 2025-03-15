import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { listings, conversations, messages } from '@shared/schemas';
import { eq, sql } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { imageService } from '@/lib/image-service';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Tekil ilan detayı API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz ilan ID' },
        { status: 400 }
      );
    }

    // Auth token'ı al (varsa)
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }
    // Token varsa kullanıcı ID'sini çıkar
    let userId = Number(token.sub)

    // Önce ilanı bul
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      );
    }

    // İlan sahibi veya onaylı ve aktif ilan kontrolü
    if (!(userId && listing.userId === userId) && !(listing.approved && listing.active)) {
      return NextResponse.json(
        { success: false, message: 'Bu ilana erişim izniniz yok' },
        { status: 403 }
      );
    }

    // İlan görüntüleme sayısını artır
    await db.execute(sql`
      UPDATE listings
      SET views = COALESCE(views, 0) + 1
      WHERE id = ${id};
    `);

    // Güncel ilanı yeniden al
    const updatedListing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
    });

    if (!updatedListing) {
      return NextResponse.json(
        { success: false, message: 'İlan güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // İlan resimlerini URL'lere dönüştür
    const listingWithImageUrls = {
      ...updatedListing,
      images: updatedListing.images ? updatedListing.images.map(img => `/images/${img}`) : []
    };

    return NextResponse.json(listingWithImageUrls, { status: 200 });
  } catch (error) {
    console.error('Listing detail fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'İlan detayı alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// İlan düzenleme API'si
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // İlan ID'sini al ve doğrula
    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz ilan ID' },
        { status: 400 }
      );
    }

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

    // İlanı kontrol et ve kullanıcının yetkisi var mı doğrula
    const [originalListing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!originalListing) {
      return NextResponse.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      );
    }

    if (originalListing.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Bu ilanı düzenleme yetkiniz yok' },
        { status: 403 }
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

    // Güncellenecek verileri hazırla
    const updates: { 
      title: string;
      description: string;
      city: string;
      categoryId: number;
      listingType: string;
      contactPerson: string;
      phone: string;
      approved: boolean;
      active: boolean;
      user_ip: string;
      images?: string[];
    } = {
      title,
      description,
      city,
      categoryId: Number(categoryId),
      listingType: listingType || "standard",
      contactPerson: contactPerson || "",
      phone: phone || "",
      approved: false, // Düzenlenen ilanların yeniden onaylanması gerekir
      active: true,
      user_ip,
    };

    // Eğer yeni resim yüklendiyse görüntüleri güncelle
    if (imageUrls.length > 0) {
      updates.images = imageUrls;
    }

    // İlanı güncelle
    const updatedListing = await storage.updateListing(
      listingId,
      userId,
      updates
    );

    // İlan güncellendi bilgisini logla
    console.log(`İlan güncellendi: ${updatedListing.id}, kullanıcı: ${userId}`);
    
    return NextResponse.json(updatedListing, { status: 200 });
  } catch (error) {
    console.error("İlan güncelleme hatası:", error);
    return NextResponse.json(
      { success: false, message: 'İlan güncellenemedi' },
      { status: 500 }
    );
  }
}

// İlan silme API'si
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth token'ı al
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
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

    // İlanı bul
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!listing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcı sadece kendi ilanını silebilir
    if (listing.userId !== parseInt(token.sub!)) {
      return NextResponse.json(
        { error: "Bu ilanı silme yetkiniz yok" },
        { status: 403 }
      );
    }

    // İlgili resimleri sil
    if (listing.images && listing.images.length > 0) {
      await imageService.deleteMultipleImages(listing.images);
    }

    // İlanla ilgili konuşmaları bul
    const conversationsToDelete = await db
      .select()
      .from(conversations)
      .where(eq(conversations.listingId, listingId));

    // Her konuşma için mesajları sil
    for (const conversation of conversationsToDelete) {
      await db
        .delete(messages)
        .where(eq(messages.conversationId, conversation.id));
    }

    // Konuşmaları sil
    await db
      .delete(conversations)
      .where(eq(conversations.listingId, listingId));

    // İlanı sil
    const [deletedListing] = await db
      .delete(listings)
      .where(eq(listings.id, listingId))
      .returning();

    return NextResponse.json({
      success: true,
      deletedData: {
        listing: deletedListing,
        conversationsCount: conversationsToDelete.length,
        imagesCount: listing.images?.length || 0,
      }
    });
  } catch (error) {
    console.error("İlan silme hatası:", error);
    return NextResponse.json(
      { error: "İlan ve ilgili veriler silinemedi" },
      { status: 500 }
    );
  }
} 