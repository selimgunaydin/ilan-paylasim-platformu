import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../server/db';
import { categories } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Slug parametresi ile kategori getirme API'si
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    // Veritabanından slug'a göre kategori bulma
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    
    // Kategori bulunamadıysa 404 dön
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }
    
    // Başarılı yanıt
    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error(`Kategori getirme hatası (${slug}):`, error);
    
    // Hata durumunda yanıt
    return NextResponse.json(
      { success: false, message: 'Kategori getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 