import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, LISTING_BUCKET_NAME, LISTING_BUCKET_URL } from '@/lib/r2';
import { checkAdminAuth } from '@/utils/check-admin';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Dosyayı al
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string || 'logo'; // 'logo' veya 'favicon'
    
    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı" },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    let validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    
    // Favicon için .ico formatını da kabul et
    if (uploadType === 'favicon') {
      validTypes.push('image/x-icon', 'image/vnd.microsoft.icon');
    }
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Sadece ${uploadType === 'favicon' ? 'ICO, ' : ''}JPEG, PNG, WebP ve SVG formatları desteklenmektedir` },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dosya 5MB'dan küçük olmalıdır" },
        { status: 400 }
      );
    }

    // Dosyayı buffer'a dönüştür
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);
    
    // Dosya işleme (SVG ve ICO hariç diğer formatları optimize et)
    let processedBuffer = fileBuffer;
    let mimeType = file.type;
    let fileExtension = file.name.split('.').pop() || file.type.split('/')[1];
    
    // .ico formatı veya SVG dosyalarını olduğu gibi kullan
    const skipProcessing = file.type === 'image/svg+xml' || 
                           file.type === 'image/x-icon' || 
                           file.type === 'image/vnd.microsoft.icon';
    
    if (!skipProcessing) {
      try {
        // Resimleri optimize et, boyutlarını koru ama kaliteyi düşür
        processedBuffer = await sharp(fileBuffer)
          .webp({ quality: 80 })
          .toBuffer();
        mimeType = 'image/webp';
        fileExtension = 'webp';
      } catch (error) {
        console.error("Resim optimizasyon hatası:", error);
      }
    }

    // Dosya adını oluştur
    const timestamp = Date.now();
    const fileName = uploadType === 'favicon' 
      ? `site/favicon_${timestamp}.${fileExtension}`
      : `site/logo_${timestamp}.${fileExtension}`;

    // Dosyayı R2'ye yükle
    await r2Client.send(
      new PutObjectCommand({
        Bucket: LISTING_BUCKET_NAME,
        Key: fileName,
        Body: processedBuffer,
        ContentType: mimeType,
        ACL: "public-read",
      })
    );

    // Tam URL oluştur
    const fileUrl = `${LISTING_BUCKET_URL}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl
    });
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 