import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { categories, listings } from '@shared/schemas';
import { eq, sql } from 'drizzle-orm';

// Kategori silinebilirlik kontrolü API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { canDelete: false, reason: "Geçersiz kategori ID" },
        { status: 400 }
      );
    }

    // Önce kategori var mı kontrol et
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { canDelete: false, reason: "Kategori bulunamadı" },
        { status: 404 }
      );
    }

    // Alt kategorileri kontrol et
    const subCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    if (subCategories.length > 0) {
      return NextResponse.json({
        canDelete: false,
        reason: "Bu kategori silinemez çünkü alt kategorileri var",
        childCategories: subCategories.length
      });
    }

    // Kategoriye ait ilanları kontrol et
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(listings)
      .where(eq(listings.categoryId, categoryId));

    if (result.count > 0) {
      return NextResponse.json({
        canDelete: false,
        reason: "Bu kategori silinemez çünkü içinde ilanlar var",
        listingCount: result.count
      });
    }

    // Tüm kontroller başarılı, kategori silinebilir
    return NextResponse.json({ canDelete: true });
  } catch (error) {
    console.error("Kategori silinebilirlik kontrolü hatası:", error);
    return NextResponse.json(
      { canDelete: false, reason: "Bir hata oluştu" },
      { status: 500 }
    );
  }
} 