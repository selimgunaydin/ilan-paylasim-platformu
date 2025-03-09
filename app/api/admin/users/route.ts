import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { users } from '@shared/schema';
import { eq, SQL } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Kullanıcı listesi getirme API'si
export async function GET(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli veya admin yetkisi yok" },
        { status: 401 }
      );
    }

    // Filtre parametrelerini al
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender');
    const usedAd = searchParams.get('usedAd');
    const status = searchParams.get('status');
    const yuksekUye = searchParams.get('yuksekUye');

    // Temel sorgu oluştur
    let query = db.select().from(users);
    let whereConditions: SQL[] = [];

    // Filtreleri hazırla
    if (gender && gender !== "all") {
      whereConditions.push(eq(users.gender, gender));
    }

    if (usedAd && usedAd !== "all") {
      whereConditions.push(eq(users.used_free_ad, usedAd === "yes" ? 1 : 0));
    }

    if (status && status !== "all") {
      const statusValue = status === "true" || status === "1" || status === "yes";
      whereConditions.push(eq(users.status, statusValue));
    }

    if (yuksekUye && yuksekUye !== "all") {
      const yuksekUyeValue = yuksekUye === "yes" || yuksekUye === "true" || yuksekUye === "1";
      whereConditions.push(eq(users.yuksekUye, yuksekUyeValue));
    }

    // Filtreleri uygula
    for (const condition of whereConditions) {
      query = query.where(condition) as any;
    }

    const userList = await query;

    // Hassas bilgileri çıkar
    const safeUsers = userList.map(user => {
      const { password, verificationToken, resetPasswordToken, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Kullanıcı listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcılar yüklenemedi" },
      { status: 500 }
    );
  }
}