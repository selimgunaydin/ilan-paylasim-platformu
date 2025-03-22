import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@shared/db';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@app/api/auth/[...nextauth]/route';

// İletişim mesajını silmek için DELETE endpoint'i
export async function DELETE(
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

    // Mesajı sil
    await db.delete(schema.contact_messages)
      .where(eq(schema.contact_messages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    return NextResponse.json(
      { error: 'Mesaj silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 