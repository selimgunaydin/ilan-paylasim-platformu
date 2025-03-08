import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getToken } from 'next-auth/jwt';


// Dosya türünü belirleme fonksiyonu
function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
  
  if (imageTypes.includes(ext)) {
    return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  }
  
  // Diğer dosya türleri için
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
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
    
    // Dosya kaydetme dizinini oluştur (public/uploads/messages)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'messages');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Directory creation error:', err);
    }
    
    // Dosyaları kaydet ve URL'leri topla
    const savedFiles: string[] = [];
    const fileTypes: string[] = [];
    
    for (const file of files) {
      // Dosyayı işle
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${uuidv4()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = join(uploadDir, fileName);
      
      // Dosyayı kaydet
      await writeFile(filePath, fileBuffer);
      
      // URL ve tip bilgisini kaydet
      const fileUrl = `/uploads/messages/${fileName}`;
      savedFiles.push(fileUrl);
      fileTypes.push(getFileType(file.name));
    }
    
    return NextResponse.json({
      success: true,
      files: savedFiles,
      fileTypes: fileTypes
    });
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}