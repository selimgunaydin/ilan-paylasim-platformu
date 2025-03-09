import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from "@/lib/db";
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Auth token'ı al
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Oturum açılmamış'
      }, { status: 401 });
    }

    // Token'dan kullanıcı ID'sini al
    const userId = Number(token.sub);

    // Kullanıcı bilgilerini veritabanından al
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        isAdmin: true,
        lastSeen: true,
        used_free_ad: true,
        profileImage: true,
        profileVisibility: true,
        gender: true,
        age: true,
        city: true,
        aboutMe: true,
        avatar: true,
        yuksekUye: true,
        status: true,
        phone: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 });
    }

    // Kullanıcı durumunu döndür
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        ...user,
        profileImage: user.profileImage ? `/images/${user.profileImage}` : null,
        avatar: user.avatar ? `/images/${user.avatar}` : null
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Kullanıcı durumu kontrolü hatası:', error);
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı durumu kontrol edilirken bir hata oluştu'
    }, { status: 500 });
  }
} 