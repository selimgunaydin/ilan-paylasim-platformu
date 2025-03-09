import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { categories } from '@shared/schema';
import { db } from '@/lib/db';

// Kategorileri getirme API'si
export async function GET(request: NextRequest) {
  try {
    // Veritabanından tüm kategorileri al
    const allCategories = await db.select().from(categories);
    
    // Başarılı yanıt
    return NextResponse.json(allCategories, { status: 200 });
  } catch (error) {
    console.error('Kategoriler getirme hatası:', error);
    
    // Hata durumunda yanıt
    return NextResponse.json(
      { success: false, message: 'Kategoriler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 