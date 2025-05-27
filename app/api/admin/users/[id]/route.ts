import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users, listings } from '@shared/schemas';
import { eq, and } from 'drizzle-orm';

// Kullanıcı detaylarını getirme API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 400 }
      );
    }

    // Kullanıcı bilgilerini getir
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcının ilanlarını getir
    const userListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        createdAt: listings.createdAt,
        status: listings.approved,
        listingType: listings.listingType,
        city: listings.city,
        active: listings.active,
        views: listings.views
      })
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(listings.createdAt);

    return NextResponse.json({
      user,
      listings: userListings
    });
  } catch (error) {
    console.error("Kullanıcı detayları getirilirken hata:", error);
    return NextResponse.json(
      { error: "Kullanıcı detayları getirilemedi" },
      { status: 500 }
    );
  }
}

// Kullanıcı silme API'si
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 400 }
      );
    }

    // Kullanıcıyı sil
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kullanıcı silme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı silinemedi" },
      { status: 500 }
    );
  }
} 