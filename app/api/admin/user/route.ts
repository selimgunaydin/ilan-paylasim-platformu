import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db";
import { users } from '@shared/schemas'; 
import { eq, sql, and } from "drizzle-orm"; 
import jwt from "jsonwebtoken";
import { checkAdminAuth } from "@/utils/check-admin";

export const dynamic = 'force-dynamic';

// Admin kullanıcı bilgilerini getirme API'si
export async function GET(request: NextRequest) {
  try {
    const adminAuthInfo = await checkAdminAuth(request);
    if (!adminAuthInfo) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Admin kullanıcısını users tablosundan bul
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
        // type: sql<'admin'>`'admin'` // Bu zaten checkAdminAuth ile doğrulanıyor ve session'da var
      })
      .from(users)
      .where(and(eq(users.id, Number(adminAuthInfo.userId)), eq(users.isAdmin, true)));

    if (!user) {
      return NextResponse.json({ error: "Admin kullanıcısı bulunamadı veya yetkisi yok" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      type: 'admin' // Yanıta type ekleyebiliriz, frontend bunu bekliyorsa
    });
  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json({ error: "Kullanıcı bilgileri alınırken sunucu hatası oluştu" }, { status: 500 });
  }
} 