import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db";
import { users } from '@shared/schemas';
import { eq } from "drizzle-orm";
import { getToken } from 'next-auth/jwt';
import { uploadProfileImage } from '../../../lib/r2';

export const dynamic = 'force-dynamic';

// Profil resmi yükleme API'si
export async function POST(request: NextRequest) {
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

    // userId'yi al
    const userId = Number(token.sub);

    // FormData'dan dosyayı al
    const formData = await request.formData();
    const file = formData.get('profileImage') as File;

    // Dosya kontrolü
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Profil resmi yüklemek zorunludur' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    const ALLOWED_FILE_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Sadece JPEG, PNG, WEBP ve GIF formatları desteklenir' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Dosya boyutu en fazla 5MB olabilir' },
        { status: 400 }
      );
    }

    // Dosyayı buffer'a çevir ve Multer formatına dönüştür
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Multer benzeri bir file objesi oluştur
    const multerFile = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size
    };

    // R2'ye yükle
    const fileName = await uploadProfileImage(multerFile as any, userId);
    
    // Kullanıcının profil resmini veritabanında güncelle
    await db
      .update(users)
      .set({ profileImage: fileName })
      .where(eq(users.id, userId));
    
    // Güncellenmiş kullanıcı bilgilerini getir
    const [updatedUser] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        profileImage: users.profileImage,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Profil resmi başarıyla güncellendi',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Profil resmi yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 