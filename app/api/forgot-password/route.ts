import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { generatePasswordResetEmail, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email adresi gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    // Kullanıcı bulunamasa bile güvenlik için aynı mesajı döndür
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'Şifre sıfırlama bağlantısı gönderildi' },
        { status: 200 }
      );
    }

    // Reset token oluştur (1 saat geçerli)
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 saat

    // Token'ı kaydet
    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry
      })
      .where(eq(users.id, user.id));

    // Şifre sıfırlama emaili gönder
    const emailParams = generatePasswordResetEmail(email, resetToken);
    await sendEmail(emailParams);

    return NextResponse.json(
      { success: true, message: 'Şifre sıfırlama bağlantısı gönderildi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 