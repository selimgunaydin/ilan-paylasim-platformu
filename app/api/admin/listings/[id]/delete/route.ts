import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { listings, conversations, messages } from '@/schemas/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { imageService } from '@/lib/image-service';

// Admin yetkilendirme kontrolü fonksiyonu
import { checkAdminAuth } from '@/utils/check-admin';

// İlan silme API'si
export async function DELETE(
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

    // İlanı bul
    const listing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing.length) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    // İlgili resimleri sil
    if (listing[0].images && listing[0].images.length > 0) {
      await imageService.deleteMultipleImages(listing[0].images);
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
        imagesCount: listing[0].images?.length || 0,
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