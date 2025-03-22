import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@shared/db';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/auth-options';

// İletişim mesajını okundu olarak işaretlemek için PUT endpoint'i
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Yönetici oturumunu kontrol et
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz mesaj ID' },
        { status: 400 }
      );
    }

    // Mesajı okundu olarak işaretle
    await db.update(schema.contact_messages)
      .set({ isRead: true })
      .where(eq(schema.contact_messages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mesaj durumu güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Mesaj durumu güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 