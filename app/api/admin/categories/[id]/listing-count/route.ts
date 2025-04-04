import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { listings } from '@shared/schemas';
import { eq, sql } from 'drizzle-orm';

// Kategori başına ilan sayısını getirme API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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