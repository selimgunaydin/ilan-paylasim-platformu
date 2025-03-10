import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Kullanıcı durumunu güncelleme API'si (ban/unban)
export async function PATCH(
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

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 400 }
      );
    }

    // Request body'den durum bilgisini al
    const body = await request.json();
    const { status } = body;

    if (status === undefined) {
      return NextResponse.json(
        { error: "Durum bilgisi gereklidir" },
        { status: 400 }
      );
    }

    // Boolean kontrolü
    const statusValue = typeof status === 'boolean' ? status : 
                       (status === 'true' || status === '1' || status === 'yes');

    // Kullanıcıyı güncelle
    const [updatedUser] = await db
      .update(users)
      .set({ status: statusValue })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Hassas bilgileri çıkar
    const { password, verificationToken, resetPasswordToken, ...safeUser } = updatedUser;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Kullanıcı durumu güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı durumu güncellenemedi" },
      { status: 500 }
    );
  }
} 