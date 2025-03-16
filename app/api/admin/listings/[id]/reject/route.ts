import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings, users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../../../../../../services/email';
import { generateListingRejectedEmail } from '../../../../../../services/email-templates';

// İlan reddetme API'si
export async function PUT(
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

    // İlanı bul ve güncelle
    const [updatedListing] = await db
      .update(listings)
      .set({ active: false, approved: false })
      .where(eq(listings.id, listingId))
      .returning();

    if (!updatedListing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    // İlan sahibini bul ve e-posta gönder
    if (updatedListing.userId) {
      const [listingOwner] = await db
        .select()
        .from(users)
        .where(eq(users.id, updatedListing.userId));

      if (listingOwner && listingOwner.email) {
        const emailTemplate = generateListingRejectedEmail(
          listingOwner.username,
          updatedListing.title
        );
        
        emailTemplate.to = listingOwner.email;
        
        try {
          await sendEmail(emailTemplate);
          console.log(`Rejection email sent to ${listingOwner.email} for listing ${listingId}`);
        } catch (emailError) {
          console.error("Error sending rejection email:", emailError);
          // Email gönderimi başarısız olsa bile API yanıtını etkilemez
        }
      }
    }

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error("İlan reddetme hatası:", error);
    return NextResponse.json(
      { error: "İlan reddedilemedi" },
      { status: 500 }
    );
  }
} 