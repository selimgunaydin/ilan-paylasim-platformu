import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db';
import { users } from '@shared/schemas'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // URL'den token parametresini al
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Token yoksa hata döndür
    if (!token) {
      return NextResponse.json(
        { error: 'Token bulunamadı' }, 
        { status: 400 }
      )
    }

    // Verilen token ile kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))

    // Kullanıcı bulunamazsa hata döndür
    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz doğrulama token\'ı' }, 
        { status: 400 }
      )
    }

    // Kullanıcı zaten doğrulanmışsa bilgi ver
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email adresi zaten doğrulanmış' }, 
        { status: 200 }
      )
    }

    // Email doğrulama bilgisini güncelle
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null
      })
      .where(eq(users.id, user.id))

    return NextResponse.json(
      { message: 'Email adresiniz başarıyla doğrulandı' }, 
      { status: 200 }
    )
  } catch (error) {
    console.error('Email doğrulama hatası:', error)
    return NextResponse.json(
      { error: 'Email doğrulama işlemi sırasında bir hata oluştu' }, 
      { status: 500 }
    )
  }
} 