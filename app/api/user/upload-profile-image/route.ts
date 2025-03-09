import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from '@shared/schema';
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { getToken } from 'next-auth/jwt';
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
    const userId = Number(token.sub);;

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

    // Dosyayı işle
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Resmi optimize et (boyutlarını küçült ve webp formatına dönüştür)
    const optimizedImage = await sharp(fileBuffer)
      .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Dosya adını oluştur
    const fileName = `profile_${userId}_${uuidv4()}.webp`;
    
    // Dosya kaydetme dizini oluştur
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadDir, { recursive: true });
    
    // Dosyayı kaydet
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, optimizedImage);
    
    // Dosya URL'sini oluştur
    const profileImageUrl = `/uploads/profiles/${fileName}`;
    
    // Kullanıcının profil resmini güncelle
    await db
      .update(users)
      .set({ profileImage: profileImageUrl })
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