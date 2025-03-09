import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { listings } from '@/schemas/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
// Kullanıcının kendi ilanlarını getiren API
export async function GET(request: NextRequest) {
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

    // Kullanıcının ilanlarını getir
    const userListings = await db
      .select()
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(listings.createdAt);

    return NextResponse.json(userListings);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json(
      { error: "Kullanıcı ilanları getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 