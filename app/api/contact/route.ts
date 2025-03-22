import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@shared/db';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Doğrulama şeması
const contactFormSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  subject: z.string().min(2, 'Konu en az 2 karakter olmalıdır'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır')
});

// İletişim formu göndermek için POST endpoint'i
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Formun doğrulanması
    const validation = contactFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Geçersiz form verileri', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, subject, message } = validation.data;
    
    // IP adresi alınması
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
    
    // Mesajın veritabanına kaydedilmesi
    const newMessage = await db.insert(schema.contact_messages).values({
      name,
      email,
      subject,
      message,
      ip_address: ip_address as string
    }).returning();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.' 
    });

  } catch (error) {
    console.error('İletişim formu hatası:', error);
    return NextResponse.json(
      { error: 'Mesaj gönderilirken bir hata oluştu', details: error },
      { status: 500 }
    );
  }
}

// Admin için iletişim mesajlarını almak için GET endpoint'i
export async function GET(request: NextRequest) {
  try {
    // Yönetici oturumunu kontrol et
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }
    
    // Okunmuş/okunmamış filtresi
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    let messages;
    
    if (isRead === 'true' || isRead === 'false') {
      const isReadBool = isRead === 'true';
      messages = await db.query.contact_messages.findMany({
        where: eq(schema.contact_messages.isRead, isReadBool),
        orderBy: (columns) => [columns.createdAt]
      });
    } else {
      // Tüm mesajları getir
      messages = await db.query.contact_messages.findMany({
        orderBy: (columns) => [columns.createdAt]
      });
    }
    
    return NextResponse.json({ messages });
    
  } catch (error) {
    console.error('İletişim mesajları alınırken hata:', error);
    return NextResponse.json(
      { error: 'Mesajlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 