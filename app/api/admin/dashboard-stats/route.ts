import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { listings, users, conversations, messages } from '@/schemas/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Dashboard istatistikleri API'si
export async function GET(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Toplam kullanıcı sayısı
    const [totalUsers] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(users);

    // Toplam ilan sayısı
    const [totalListings] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(listings);

    // Aktif ilan sayısı
    const [activeListings] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(listings)
      .where(
        and(
          eq(listings.approved, true),
          eq(listings.active, true)
        )
      );

    // Onay bekleyen ilan sayısı
    const [pendingListings] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(listings)
      .where(
        and(
          eq(listings.approved, false),
          eq(listings.active, true)
        )
      );

    // Toplam mesaj sayısı
    const [totalMessages] = await db
      .select({
        count: sql<number>`count(*)::int`
      })
      .from(messages);

    // Son 10 yeni kullanıcı
    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        lastSeen: users.lastSeen
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    // Son 10 ilan
    const recentListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        createdAt: listings.createdAt,
        approved: listings.approved,
        active: listings.active
      })
      .from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(10);

    return NextResponse.json({
      totalUsers: totalUsers.count,
      totalListings: totalListings.count,
      activeListings: activeListings.count,
      pendingListings: pendingListings.count,
      totalMessages: totalMessages.count,
      recentUsers,
      recentListings
    });
  } catch (error) {
    console.error("Dashboard istatistikleri getirme hatası:", error);
    return NextResponse.json(
      { error: "İstatistikler yüklenemedi" },
      { status: 500 }
    );
  }
} 