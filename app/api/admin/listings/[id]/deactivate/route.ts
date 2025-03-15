import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings } from '@shared/schemas';
import { eq } from 'drizzle-orm';

// İlan pasif duruma getirme API'si
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

    // İlanı bul ve pasif duruma getir
    const [updatedListing] = await db
      .update(listings)
      .set({ active: false })
      .where(eq(listings.id, listingId))
      .returning();

    if (!updatedListing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error("İlan pasif duruma getirme hatası:", error);
    return NextResponse.json(
      { error: "İlan pasif duruma getirilemedi" },
      { status: 500 }
    );
  }
} 