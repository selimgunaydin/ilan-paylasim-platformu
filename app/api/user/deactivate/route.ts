import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

// Kullanıcının kendi hesabını pasife alması için PATCH metodu
export async function PATCH(request: NextRequest) {
  try {
    // Oturum token'ını al
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Token yoksa veya geçersizse, yetkilendirme hatası döndür
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli.' },
        { status: 401 }
      );
    }

    const userId = Number(token.sub);

    // Kullanıcının durumunu veritabanında 'false' (pasif) olarak güncelle
    const result = await db
      .update(users)
      .set({ status: false })
      .where(eq(users.id, userId))
      .returning();

    // Kullanıcı bulunamadıysa veya güncellenemediyse hata döndür
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı veya işlem başarısız.' },
        { status: 404 }
      );
    }

    // Başarı mesajı ile birlikte cookie'leri temizleyerek çıkış yapmasını sağla
    const response = NextResponse.json(
      {
        success: true,
        message: 'Hesabınız başarıyla pasife alındı. Oturumunuz sonlandırılıyor...',
      },
      { status: 200 }
    );

    // Oturumla ilgili cookie'leri temizle
    response.cookies.delete('auth-token');
    response.cookies.delete('next-auth.session-token');

    return response;
  } catch (error) {
    console.error('Account deactivation error:', error);
    return NextResponse.json(
      { success: false, message: 'Hesap pasife alınırken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
