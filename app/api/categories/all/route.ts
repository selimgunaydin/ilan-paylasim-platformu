import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { categories, listings } from '@shared/schemas';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

// Kategori tipini tanımlıyoruz (TypeScript için)
interface Category {
  id: number;
  name: string;
  parentId: number | null;
  slug: string;
  order: number;
  customTitle: string | null;
  metaDescription: string | null;
  content: string | null;
  faqs: string | null;
  listingCount: number;
  children?: Category[];
}

export async function GET() {
  try {
    // Tek sorgu ile kategorileri ve ilan sayılarını al
    const rawCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        slug: categories.slug,
        order: categories.order,
        customTitle: categories.customTitle,
        metaDescription: categories.metaDescription,
        content: categories.content,
        faqs: categories.faqs,
        listingCount: sql<number>`count(listings.id)::int`,
      })
      .from(categories)
      .leftJoin(listings, sql`${categories.id} = ${listings.categoryId}`)
      .groupBy(categories.id);

    // Hiyerarşik yapıyı oluştur
    const categoryMap: { [key: number]: Category } = {};
    const rootCategories: Category[] = [];

    // Her kategoriyi haritaya ekle ve children dizisini başlat
    rawCategories.forEach((cat) => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Parent-child ilişkisini kur
    rawCategories.forEach((cat) => {
      if (cat.parentId === null) {
        // Ana kategori, kök diziye ekle
        rootCategories.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parentId]) {
        // Alt kategori, üst kategorinin children dizisine ekle
        categoryMap[cat.parentId].children!.push(categoryMap[cat.id]);
      }
    });

    // Sıralama (order'a göre)
    rootCategories.sort((a, b) => a.order - b.order);
    rootCategories.forEach((cat) =>
      cat.children?.sort((a, b) => a.order - b.order)
    );

    // Başarılı yanıt
    return NextResponse.json(rootCategories, { status: 200 });
  } catch (error) {
    console.error('Kategoriler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kategoriler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}