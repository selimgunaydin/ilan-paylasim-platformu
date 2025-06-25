import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings, users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@shared/services/email';
import { generateListingApprovedEmail } from '@shared/services/email-templates';

// İlan onaylama API'si
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

    // İlanı onayla
    const [updatedListing] = await db
      .update(listings)
      .set({ approved: true })
      .where(eq(listings.id, listingId))
      .returning();

    // Eğer standart ilan onaylandıysa has_used_free_ad değerini true yap
    if (listing.listingType === "standard") {
      await db
        .update(users)
        .set({ has_used_free_ad: true })
        .where(eq(users.id, Number(listing.userId)));

      console.log(
        `Used free ad updated for user ${listing.userId} after approving standard listing ${listingId}`
      );
    }

    // İlan sahibini bul ve onay e-postası gönder
    if (listing.userId) {
      const [listingOwner] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(listing.userId)));

      if (listingOwner && listingOwner.email) {
        const emailTemplate = generateListingApprovedEmail(
          listingOwner.username,
          listing.title
        );
        
        emailTemplate.to = listingOwner.email;
        
        try {
          await sendEmail(emailTemplate);
          console.log(`Approval email sent to ${listingOwner.email} for listing ${listingId}`);
        } catch (emailError) {
          console.error("Error sending approval email:", emailError);
          // Email gönderimi başarısız olsa bile API yanıtını etkilemez
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İlan onaylama hatası:", error);
    return NextResponse.json(
      { error: "İlan onaylanamadı" },
      { status: 500 }
    );
  }
} 