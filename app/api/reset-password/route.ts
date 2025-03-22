import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { users } from '@shared/schemas'
import { eq } from 'drizzle-orm'
import crypto, { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(32).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
} 

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token ve yeni şifre gereklidir' },
        { status: 400 }
      )
    }

    // Token ile kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token))

    // Kullanıcı bulunamadıysa veya token geçersizse
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya süresi dolmuş token' },
        { status: 400 }
      )
    }

    // Token süresini kontrol et
    if (user.resetPasswordExpires && new Date() > new Date(user.resetPasswordExpires)) {
      return NextResponse.json(
        { success: false, message: 'Şifre sıfırlama bağlantısının süresi dolmuş' },
        { status: 400 }
      )
    }

    // Yeni şifreyi hashle
    const hashedPassword = await hashPassword(newPassword)

    // Şifreyi güncelle ve token'ları temizle
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, user.id))

    return NextResponse.json(
      { success: true, message: 'Şifreniz başarıyla güncellendi' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Şifre güncelleme hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Şifre güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 