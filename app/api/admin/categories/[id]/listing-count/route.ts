import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { listings } from '@/schemas/schema';
import { eq, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Kategori başına ilan sayısını getirme API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Geçersiz kategori ID" },
        { status: 400 }
      );
    }

    // Kategorideki ilan sayısını say
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(listings)
      .where(eq(listings.categoryId, categoryId));

    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.error("Kategori ilan sayısı getirme hatası:", error);
    return NextResponse.json(
      { error: "Kategori ilan sayısı alınamadı" },
      { status: 500 }
    );
  }
} 