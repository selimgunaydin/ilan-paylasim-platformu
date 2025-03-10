import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Konuşma kullanıcı bilgilerini getirme API'si
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (isNaN(userId) || userId === 0) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 400 }
      );
    }

    // Kullanıcı bilgilerini getir
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        gender: users.gender,
        avatar: users.avatar,
        lastSeen: users.lastSeen,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Konuşma kullanıcı bilgileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı bilgileri alınamadı" },
      { status: 500 }
    );
  }
} 