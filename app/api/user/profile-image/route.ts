import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { deleteMessageFile } from '../../../../server/services/r2';
import { getToken } from 'next-auth/jwt';
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
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

 
    // userId'yi al
    const userId = Number(token.sub);;

    // Kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.profileImage) {
      return NextResponse.json({ error: "Profil resmi bulunamadı" }, { status: 404 });
    }

    // Cloudflare R2'den resmi sil
    try {
      await deleteMessageFile(user.profileImage);
    } catch (error) {
      console.error("Profil resmi silme hatası:", error);
      // Cloudflare silme hatası olsa bile devam et
    }

    // Kullanıcının profil resmini veritabanından temizle
    await db
      .update(users)
      .set({ profileImage: null })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profil resmi silme hatası:", error);
    return NextResponse.json({ error: "Profil resmi silinemedi" }, { status: 500 });
  }
} 