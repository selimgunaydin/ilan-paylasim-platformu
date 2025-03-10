import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePasswords } from '@/api/auth/[...nextauth]/route';
import { getToken } from 'next-auth/jwt';
// Kullanıcı şifre değiştirme API'si
export async function PUT(request: NextRequest) {
  try {
    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // userId'yi al
    const userId = Number(token.sub);;

    // Request body'den şifre bilgilerini al
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Gerekli alanların kontrolü
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Tüm alanlar zorunludur' },
        { status: 400 }
      );
    }

    // Yeni şifre ve onay şifresinin eşleşip eşleşmediğini kontrol et
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Yeni şifre ve onay şifresi eşleşmiyor' },
        { status: 400 }
      );
    }

    // Şifre karmaşıklık kurallarını kontrol et
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Şifre en az 8 karakter uzunluğunda olmalıdır' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Mevcut şifrenin doğruluğunu kontrol et
    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Mevcut şifre yanlış' },
        { status: 400 }
      );
    }

    // Yeni şifreyi hashle
    const hashedPassword = await hashPassword(newPassword);

    // Kullanıcının şifresini güncelle
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    return NextResponse.json(
      { success: true, message: 'Şifre başarıyla güncellendi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Şifre güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 