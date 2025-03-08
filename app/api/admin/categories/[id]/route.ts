import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../server/db';
import { categories } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { storage } from '../../../../../server/storage';
import { checkAdminAuth } from '@/utils/check-admin';

// Kategori güncelleme API'si
export async function PATCH(
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

    // Request body'den güncelleme verilerini al
    const body = await request.json();
    const { name, parentId, slug, order } = body;

    // Kategori varlık kontrolü
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: "Kategori bulunamadı" },
        { status: 404 }
      );
    }

    // Slug benzersizlik kontrolü (eğer değiştirilmişse)
    if (slug && slug !== existingCategory[0].slug) {
      const slugCheck = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.slug, slug),
            sql`${categories.id} != ${categoryId}`
          )
        )
        .limit(1);

      if (slugCheck.length > 0) {
        return NextResponse.json(
          { error: "Bu slug zaten kullanılıyor" },
          { status: 400 }
        );
      }
    }

    // Parent kategori kontrolü
    if (parentId && parentId !== existingCategory[0].parentId) {
      // Kendisini parent olarak seçemez
      if (parentId === categoryId) {
        return NextResponse.json(
          { error: "Kategori kendisini üst kategori olarak seçemez" },
          { status: 400 }
        );
      }

      const parentCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.id, parentId))
        .limit(1);

      if (parentCategory.length === 0) {
        return NextResponse.json(
          { error: "Geçersiz üst kategori" },
          { status: 400 }
        );
      }
    }

    // Kategoriyi güncelle
    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: name || existingCategory[0].name,
        parentId: parentId === undefined ? existingCategory[0].parentId : parentId,
        slug: slug || existingCategory[0].slug,
        order: order === undefined ? existingCategory[0].order : order,
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Kategori güncellenemedi" },
      { status: 500 }
    );
  }
}

// Kategori silme API'si
export async function DELETE(
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

    // Önce alt kategorileri kontrol et
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

    // Kategoriye ait ilanları kontrol et
    const listingCount = await storage.getCategoryListingCount(categoryId);
    if (listingCount > 0) {
      return NextResponse.json(
        { error: "Bu kategori silinemez çünkü içinde ilanlar var" },
        { status: 400 }
      );
    }

    // Tüm kontroller başarılı, kategoriyi sil
    await storage.deleteCategory(categoryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return NextResponse.json(
      { error: "Kategori silinemedi" },
      { status: 500 }
    );
  }
} 