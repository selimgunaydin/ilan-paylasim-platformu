import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { categories, listings } from '@shared/schemas';
import { eq, sql } from 'drizzle-orm';

// Kategori zorla silme API'si
export async function DELETE(
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

    // Kategorinin var olup olmadığını kontrol et
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { error: "Kategori bulunamadı" },
        { status: 404 }
      );
    }

    // Alt kategorileri kontrol et
    const subCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    if (subCategories.length > 0) {
      return NextResponse.json(
        { error: "Bu kategori silinemez çünkü alt kategorileri var" },
        { status: 400 }
      );
    }

    // İlgili ilanları kontrol et
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(listings)
      .where(eq(listings.categoryId, categoryId));

    if (result.count > 0) {
      return NextResponse.json(
        { error: "Bu kategori silinemez çünkü içinde ilanlar var" },
        { status: 400 }
      );
    }

    // Kategoriyi sil
    const deleted = await db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: "Kategori silinemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedCategory: deleted[0] });
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return NextResponse.json(
      { error: "Kategori silinemedi" },
      { status: 500 }
    );
  }
} 