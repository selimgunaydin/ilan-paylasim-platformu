import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users, listings, conversations, messages, favorites } from '@shared/schemas';
import { eq, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

// Oturum açmış kullanıcının bilgilerini getirme API'si
export async function GET(request: NextRequest) {
  try {
    // NextAuth token'ını al
    const authToken = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Alternatif olarak session kontrolü
    if (!authToken) {
      const session = await getServerSession({ req: request, ...authOptions });
      if (session?.user) {
        // Session varsa kullanıcı bilgilerini döndür
        const userId = parseInt(session.user.id);
        
        // Kullanıcıyı veritabanından bul
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user) {
          // Son görülme zamanını güncelle
          await db
            .update(users)
            .set({ lastSeen: new Date() })
            .where(eq(users.id, userId));

          // Kullanıcı bilgilerinden password alanını kaldır
          const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = user;
          
          // JWT token oluştur ve kullanıcı bilgisine ekle
          const userToken = jwt.sign(
            { 
              id: userId.toString(), 
              email: user.email, 
              username: user.username,
              sub: userId.toString()
            },
            process.env.NEXTAUTH_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
          );
          
          return NextResponse.json({
            ...userWithoutSensitiveData,
            token: userToken
          }, { status: 200 });
        }
      }
    }

    // NextAuth token varsa
    if (authToken) {
      const userId = parseInt(authToken.id);
      
      // Kullanıcıyı veritabanından bul
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      // Kullanıcı bulunamadıysa
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      // Kullanıcı aktif değilse
      if (user.status === false) {
        return NextResponse.json(
          { success: false, message: 'Hesabınız devre dışı bırakılmıştır' },
          { status: 403 }
        );
      }

      // Son görülme zamanını güncelle
      await db
        .update(users)
        .set({ lastSeen: new Date() })
        .where(eq(users.id, userId));

      // Kullanıcı bilgilerinden password alanını kaldır
      const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = user;
      
      // JWT token oluştur ve kullanıcı bilgisine ekle
      const userToken = jwt.sign(
        { 
          id: userId.toString(), 
          email: user.email, 
          username: user.username,
          sub: userId.toString()
        },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '30d' }
      );

      return NextResponse.json({
        ...userWithoutSensitiveData,
        token: userToken
      }, { status: 200 });
    }

    // Hiçbir token bulunamadı veya geçerli değil
    return NextResponse.json(
      { success: false, message: 'Oturum açılmamış' },
      { status: 401 }
    );
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Kullanıcı bilgileri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Kullanıcı hesabını silme API'si
export async function DELETE(request: NextRequest) {
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

    // Kullanıcıyı veritabanından bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    // Kullanıcı bulunamadıysa
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // İşlem sırası önemli:
    // 1. Kullanıcı favorilerini sil
    await db
      .delete(favorites)
      .where(eq(favorites.userId, userId));
      
    // 2. Kullanıcının gönderdiği/aldığı tüm mesajları sil
    await db
      .delete(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      );
    
    // 3. Kullanıcının gönderdiği/aldığı tüm konuşmaları sil
    await db
      .delete(conversations)
      .where(
        or(
          eq(conversations.senderId, userId),
          eq(conversations.receiverId, userId)
        )
      );
    
    // 4. Kullanıcının tüm ilanlarını sil
    await db
      .delete(listings)
      .where(eq(listings.userId, userId));
    
    // 5. Son olarak kullanıcıyı sil
    await db
      .delete(users)
      .where(eq(users.id, userId));

    // Cookie'yi temizle
    const response = NextResponse.json(
      { success: true, message: 'Hesabınız başarıyla silindi' },
      { status: 200 }
    );
    
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Hesap silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 