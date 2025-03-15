import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db";
import { admin_users } from '@shared/schemas';
import { eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { checkAdminAuth } from "@/utils/check-admin";

export const dynamic = 'force-dynamic';

// Admin kullanıcı bilgilerini getirme API'si
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAuth(request);
    if (!adminCheck) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Admin kullanıcısını bul
    const [admin] = await db
      .select({
        id: admin_users.id,
        username: admin_users.username,
        type: sql<'admin'>`'admin'`
      })
      .from(admin_users)
      .where(eq(admin_users.id, Number(adminCheck.userId)));

    if (!admin) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json(null, { status: 500 });
  }
} 