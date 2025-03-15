import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    // Auth token'ı al
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // userId'yi token'dan al
    const userId = Number(token.sub);; // veya token.id, token.userId gibi yapıya göre değişebilir

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı kimliği bulunamadı' },
        { status: 401 }
      );
    }

    // Request body'den profil verilerini al
    const body = await request.json();
    
    // Güncellenebilir alanlar
    const updatableFields = [
      'username', 'email', 'profileImage', 'profileVisibility', 
      'gender', 'age', 'city', 'aboutMe', 'avatar', 'phone'
    ];
    
    // Güncelleme için geçerli alanları filtrele
    const updateData: Record<string, any> = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    // Güncelleme yapılacak alan yoksa
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Güncellenecek veri bulunamadı' },
        { status: 400 }
      );
    }

    // Kullanıcıyı güncelle
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(userId))); // userId'yi sayıya çeviriyoruz

    // Güncellenmiş kullanıcı bilgilerini getir
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)));

    // Hassas bilgileri çıkar
    const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = updatedUser;

    return NextResponse.json(
      { success: true, message: 'Profil başarıyla güncellendi', user: userWithoutSensitiveData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Profil güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}