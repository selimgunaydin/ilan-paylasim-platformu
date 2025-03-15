import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { categories } from '@shared/schemas';
import { eq, and, asc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Tüm kategorileri getirme API'si
export async function GET() {
  try {
    // Tüm kategorileri getir
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.order));

    // Tip tanımlamaları
    type CategoryWithChildren = typeof categories.$inferSelect & {
      children: CategoryWithChildren[];
    };

    // Kategorileri hiyerarşik yapıya dönüştür
    const categoryMap = new Map<number, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // Önce tüm kategorileri map'e ekle
    allCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Parent-child ilişkilerini kur
    allCategories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id);
      if (!categoryWithChildren) return;

      if (category.parentId === null) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent && categoryWithChildren) {
          parent.children.push(categoryWithChildren);
        }
      }
    });

    return NextResponse.json(rootCategories);
  } catch (error) {
    console.error("Kategori listeleme hatası:", error);
    return NextResponse.json(
      { error: "Kategoriler yüklenemedi" },
      { status: 500 }
    );
  }
}

// Yeni kategori oluşturma API'si
export async function POST(request: NextRequest) {
  try {
    // Request body'den kategori bilgilerini al
    const body = await request.json();
    const { name, parentId, slug, order } = body;

    // Gerekli alanların kontrolü
    if (!name || !slug) {
      return NextResponse.json(
        { error: "İsim ve slug alanları zorunludur" },
        { status: 400 }
      );
    }

    // Slug benzersizlik kontrolü
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: "Bu slug zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Parent kategori kontrolü
    if (parentId) {
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

    // Yeni kategoriyi ekle
    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        parentId: parentId || null,
        slug,
        order: order || 0,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Kategori oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Kategori oluşturulamadı" },
      { status: 500 }
    );
  }
} 