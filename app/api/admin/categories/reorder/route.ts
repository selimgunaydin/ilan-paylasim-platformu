import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/schemas/schema';
import { eq, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { checkAdminAuth } from '@/utils/check-admin';


// Kategori sıralama API'si
export async function PATCH(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Gelen veriyi doğrula
    const updates = await request.json() as {
      id: number;
      order: number;
      parentId: number | null;
    }[];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Geçersiz veri formatı" }, { status: 400 });
    }

    // İşlem başarılı olursa commit, hata olursa rollback yapılacak
    const result = await db.transaction(async (tx) => {
      // Her kategori güncellemesi için
      for (const update of updates) {
        // Kategori varlığını kontrol et
        const existingCategory = await tx
          .select()
          .from(categories)
          .where(eq(categories.id, update.id))
          .limit(1);

        if (existingCategory.length === 0) {
          throw new Error(`Kategori bulunamadı: ${update.id}`);
        }

        // Parent kategori kontrolü
        if (update.parentId !== null) {
          // Kendisini parent olarak seçemez
          if (update.parentId === update.id) {
            throw new Error(
              `Kategori kendisini üst kategori olarak seçemez: ${update.id}`,
            );
          }

          const parentCategory = await tx
            .select()
            .from(categories)
            .where(eq(categories.id, update.parentId))
            .limit(1);

          if (parentCategory.length === 0) {
            throw new Error(`Geçersiz üst kategori: ${update.parentId}`);
          }
        }

        // Kategoriyi güncelle
        await tx
          .update(categories)
          .set({
            order: update.order,
            parentId: update.parentId,
          })
          .where(eq(categories.id, update.id));
      }

      // Tüm güncellemeler başarılı, güncel listeyi döndür
      return await tx
        .select()
        .from(categories)
        .orderBy(asc(categories.order));
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json({
      error: "Kategoriler güncellenirken bir hata oluştu",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
} 