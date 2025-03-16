import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings, conversations, messages, users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { imageService } from '@/lib/image-service';
import { sendEmail } from '../../../../../../services/email';
import { generateListingDeletedEmail } from '../../../../../../services/email-templates';
// İlan silme API'si
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Store the user ID and listing title before deletion
    const userId = listing.userId;
    const listingTitle = listing.title;

    // İlgili resimleri sil
    if (listing.images && listing.images.length > 0) {
      try {
        await imageService.deleteMultipleImages(listing.images);
      } catch (error) {
        console.error("Error deleting images:", error);
      }
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
    await db
      .delete(listings)
      .where(eq(listings.id, listingId));

    // İlan sahibini bul ve e-posta gönder
    if (userId) {
      const [listingOwner] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (listingOwner && listingOwner.email) {
        const emailTemplate = generateListingDeletedEmail(
          listingOwner.username,
          listingTitle
        );
        
        emailTemplate.to = listingOwner.email;
        
        try {
          await sendEmail(emailTemplate);
          console.log(`Deletion email sent to ${listingOwner.email} for listing ${listingId}`);
        } catch (emailError) {
          console.error("Error sending deletion email:", emailError);
          // Email gönderimi başarısız olsa bile API yanıtını etkilemez
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İlan silme hatası:", error);
    return NextResponse.json(
      { error: "İlan silinemedi" },
      { status: 500 }
    );
  }
} 