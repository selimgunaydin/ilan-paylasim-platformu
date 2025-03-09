import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db';
import { users } from '@/schemas/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Request body'den token ve yeni şifreyi al
    const { token, password } = await request.json()

    // Token veya şifre yoksa hata döndür
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token ve yeni şifre gereklidir' }, 
        { status: 400 }
      )
    }

    // Verilen token ile kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token))

    // Kullanıcı bulunamazsa hata döndür
    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' }, 
        { status: 400 }
      )
    }

    // Token süresini kontrol et
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return NextResponse.json(
        { error: 'Şifre sıfırlama linkinin süresi dolmuş' }, 
        { status: 400 }
      )
    }

    // Yeni şifreyi hash'le
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Kullanıcı şifresini güncelle ve sıfırlama token'ını temizle
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, user.id))

    return NextResponse.json(
      { message: 'Şifreniz başarıyla güncellendi' }, 
      { status: 200 }
    )
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error)
    return NextResponse.json(
      { error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu' }, 
      { status: 500 }
    )
  }
} 