import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Kullanıcı silme API'si
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