import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getToken } from 'next-auth/jwt';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../../../lib/r2';
import { isAllowedFileType, isAllowedFileSize, getMimeType } from '../../../lib/file-constants';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Yeni bucket ismi tanımı
const MESSAGE_BUCKET = "seriilan-mesaj-dosyalar";

// Resim dosyalarını WebP formatına dönüştürmek için yardımcı fonksiyon
async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .webp({ quality: 80 }) // 80% kalite
      .toBuffer();
  } catch (error) {
    console.error("WebP dönüşüm hatası:", error);
    return buffer; // Hata durumunda orijinal buffer'ı geri dön
  }
}

export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Oturum açılmamış' },
        { status: 401 }
      );
    }

    // Form verisini al
    const formData = await request.formData();
    
    // Dosyaları işle
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Dosya bulunamadı" },
        { status: 400 }
      );
    }
    
    // Dosyaları R2'ye yükle ve URL'leri topla
    const savedFiles: string[] = [];
    const fileTypes: string[] = [];
    
    for (const file of files) {
      // Dosya türü ve boyut kontrolü
      const mimeType = file.type || getMimeType(file.name);
      
      if (!isAllowedFileType(mimeType)) {
        return NextResponse.json(
          { error: "Geçersiz dosya formatı" },
          { status: 400 }
        );
      }
      
      if (!isAllowedFileSize(file.size, mimeType)) {
        return NextResponse.json(
          { error: "Dosya boyutu çok büyük" },
          { status: 400 }
        );
      }
      
      // Dosyayı işle
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      let processedBuffer = fileBuffer;
      let finalMimeType = mimeType;
      
      // Eğer dosya bir resim ise WebP'ye dönüştür
      if (mimeType.startsWith('image/') && mimeType !== 'image/webp' && mimeType !== 'image/gif') {
        processedBuffer = await convertToWebP(fileBuffer);
        finalMimeType = 'image/webp';
      }
      
      // Dosya adını oluştur
      const timestamp = Date.now();
      const random = uuidv4().slice(0, 8);
      const extension = finalMimeType === 'image/webp' ? 'webp' : file.name.split('.').pop();
      const fileName = `messages/${timestamp}-${random}.${extension}`;
      
      // R2'ye yükle
      await r2Client.send(
        new PutObjectCommand({
          Bucket: MESSAGE_BUCKET,
          Key: fileName,
          Body: processedBuffer,
          ContentType: finalMimeType,
          ACL: "public-read",
        })
      );
      
      // URL oluştur
      const fileUrl = fileName; // Sadece key'i döndür, frontend bunu kullanarak tam URL'yi oluşturabilir
      savedFiles.push(fileUrl);
      fileTypes.push(finalMimeType);
    }
    
    return NextResponse.json({
      success: true,
      files: savedFiles,
      fileTypes: fileTypes
    });
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}