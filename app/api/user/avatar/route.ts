import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { users } from '@/schemas/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
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

    // Request body'den avatar verilerini al
    const body = await request.json();
    const { avatar } = body;

    if (!avatar) {
      return NextResponse.json({ error: "Avatar yolu gerekli" }, { status: 400 });
    }

    // Kullanıcının avatar bilgisini güncelle
    const [updatedUser] = await db
      .update(users)
      .set({ avatar: avatar })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Avatar güncelleme hatası:", error);
    return NextResponse.json({ error: "Avatar güncellenemedi" }, { status: 500 });
  }
} 