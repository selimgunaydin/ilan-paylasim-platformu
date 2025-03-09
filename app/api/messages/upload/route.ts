import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { conversations, messages } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { sanitizeInput } from '@/lib/sanitize';
import { getToken } from "next-auth/jwt";

// Dosya türü belirleme fonksiyonu
function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
    return 'video';
  } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
    return 'audio';
  } else {
    return 'document';
  }
}

// File handling constants
const ALLOWED_FILE_TYPES = [
  // Resimler
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  // Dokümanlar
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Arşivler
  'application/zip',
  'application/x-rar-compressed',
  // Medya
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
];

const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  AUDIO: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  OTHER: 10 * 1024 * 1024, // 10MB
};

// Dosya büyüklük kontrolü
function checkFileSize(file: File, fileType: string): boolean {
  let maxSize = FILE_SIZE_LIMITS.OTHER;
  
  if (fileType === 'image') {
    maxSize = FILE_SIZE_LIMITS.IMAGE;
  } else if (fileType === 'video') {
    maxSize = FILE_SIZE_LIMITS.VIDEO;
  } else if (fileType === 'audio') {
    maxSize = FILE_SIZE_LIMITS.AUDIO;
  } else if (fileType === 'document') {
    maxSize = FILE_SIZE_LIMITS.DOCUMENT;
  }
  
  return file.size <= maxSize;
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
    
    // Dosya kontrolü ve kaydetme
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
        // Dosya tipi kontrolü
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json(
            { success: false, message: `Desteklenmeyen dosya tipi: ${file.type}` },
            { status: 400 }
          );
        }
        
        // Dosya boyutu kontrolü
        const fileType = getFileType(file.name);
        if (!checkFileSize(file, fileType)) {
          const maxSize = fileType === 'image' ? '5MB' : 
                          fileType === 'video' ? '50MB' :
                          fileType === 'audio' ? '10MB' :
                          fileType === 'document' ? '20MB' : '10MB';
          
          return NextResponse.json(
            { success: false, message: `Dosya boyutu çok büyük. Maksimum boyut: ${maxSize}` },
            { status: 400 }
          );
        }
        
        // Dosyayı kaydet
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop() || 'bin';
        const fileName = `message_${timestamp}_${uuidv4()}.${fileExt}`;
        
        // Dosya kaydetme dizini oluştur
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
        await mkdir(uploadDir, { recursive: true });
        
        // Dosyayı kaydet
        const filePath = path.join(uploadDir, fileName);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, fileBuffer);
        
        // Dosya URL'si ve tipini listeye ekle
        fileUrls.push(`/uploads/messages/${fileName}`);
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
    
    // WebSocket bildirimi gönderme burada yapılabilir
    
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
      { success: false, message: "Mesaj gönderilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 