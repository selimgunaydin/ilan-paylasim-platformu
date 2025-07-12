import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { conversations, messages } from '@shared/schemas';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { sanitizeInput } from '@/lib/sanitize';
import { getToken } from "next-auth/jwt";
import sharp from "sharp";
import { r2Client } from "../../../lib/r2";
import { isAllowedFileType, isAllowedFileSize } from "../../../lib/file-constants";
import { getMessageFileUrl } from "../../../lib/r2";

// Bucket tanımlaması
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

// Mesaj oluşturma API'si (dosya yükleme ile)
export async function POST(request: NextRequest) {
  try {
    // Auth token'ı al
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Lütfen giriş yapınız" },
        { status: 401 }
      );
    }

    const userId = Number(token.sub);
    
    // FormData'dan bilgileri al
    const formData = await request.formData();
    const conversationId = formData.get('conversationId') as string;
    const message = formData.get('message') as string;
    const files = formData.getAll('files') as File[];
    
    // Temiz mesaj içeriği
    const sanitizedMessage = sanitizeInput(message?.trim());
    
    // Konuşma ID kontrolü
    if (!conversationId || isNaN(parseInt(conversationId))) {
      return NextResponse.json(
        { success: false, message: "Geçersiz konuşma ID" },
        { status: 400 }
      );
    }
    
    // Mesaj veya dosya kontrolü
    if (!sanitizedMessage && (!files || files.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Mesaj içeriği veya dosya zorunludur" },
        { status: 400 }
      );
    }
    
    // Konuşmayı bul ve yetki kontrolü yap
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parseInt(conversationId)));
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Konuşma bulunamadı" },
        { status: 404 }
      );
    }
    
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json(
        { success: false, message: "Bu konuşmaya mesaj gönderme yetkiniz yok" },
        { status: 403 }
      );
    }
    
    // Dosya kontrolü ve R2'ye yükleme
    let fileUrls: string[] = [];
    let fileTypes: string[] = [];
    
    if (files && files.length > 0) {
      // Maksimum 5 dosya kontrolü
      if (files.length > 5) {
        return NextResponse.json(
          { success: false, message: "En fazla 5 adet dosya yükleyebilirsiniz" },
          { status: 400 }
        );
      }
      
      for (const file of files) {
        // Dosya tipi ve boyut kontrolü
        const mimeType = file.type;
        
        if (!isAllowedFileType(mimeType)) {
          return NextResponse.json(
            { success: false, message: `Desteklenmeyen dosya tipi: ${mimeType}` },
            { status: 400 }
          );
        }
        
        if (!isAllowedFileSize(file.size, mimeType)) {
          return NextResponse.json(
            { success: false, message: "Dosya boyutu çok büyük" },
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
        
        // Dosya türünü belirle (frontend için)
        let fileType = 'document';
        if (finalMimeType.startsWith('image/')) {
          fileType = 'image';
        } else if (finalMimeType.startsWith('video/')) {
          fileType = 'video';
        } else if (finalMimeType.startsWith('audio/')) {
          fileType = 'audio';
        }
        
        // Dosya URL'si ve tipini listeye ekle
        fileUrls.push(fileName);
        fileTypes.push(fileType);
      }
    }
    
    // IP adresi - NextJS'te doğrudan erişilemez
    const sender_ip = "0.0.0.0";
    
    // Mesajı oluştur
    const receiverId = conversation.senderId === userId 
      ? conversation.receiverId 
      : conversation.senderId;
    
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: parseInt(conversationId),
        senderId: userId,
        receiverId,
        content: sanitizedMessage || "",
        isRead: false,
        createdAt: new Date(),
        sender_ip,
        files: fileUrls.length > 0 ? fileUrls : undefined,
        fileTypes: fileTypes.length > 0 ? fileTypes : undefined
      })
      .returning();
  
    return NextResponse.json(
      { 
        success: true, 
        message: "Mesaj başarıyla gönderildi", 
        data: newMessage 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
    return NextResponse.json(
      { success: false, message: "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
} 