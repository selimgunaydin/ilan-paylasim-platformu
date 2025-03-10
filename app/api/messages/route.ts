import { NextRequest, NextResponse } from "next/server";
import { db } from '@shared/db';
import { eq } from "drizzle-orm";
import { messages, conversations } from '@shared/schemas';
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { storage } from '@/lib/storage';
import { sanitizeInput } from '@/lib/sanitize';
import { getToken } from "next-auth/jwt";
import { uploadMessageFile } from "@/lib/r2";

interface UploadedFile extends File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Dosya türü belirleme fonksiyonu
function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
    return 'video';
  } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
    return 'audio';
  } else {
    return 'document';
  }
}

// File handling constants
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic'
];

const FILE_SIZE_LIMITS = {
  IMAGE: 2 * 1024 * 1024, // 2MB 
  OTHER: 20 * 1024 * 1024, // 20MB
};

// Bu endpoint NextJS App Router ile doğrudan dosya yükleme işlemi yapamaz
// Kullanıcılar dosya yüklemek için Express tarafındaki '/api/messages' endpointini kullanmalıdır
// Bu endpoint sadece text mesaj gönderimi için kullanılabilir
export async function POST(request: NextRequest) {
  try {
    // Auth token kontrolü
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    const userId = Number(token.sub);

    // FormData'yı parse et
    const formData = await request.formData();
    const conversationId = formData.get('conversationId')?.toString();
    const message = formData.get('message')?.toString();
    const files = formData.getAll('files');

    if (!conversationId || isNaN(parseInt(conversationId))) {
      return NextResponse.json(
        { error: "Geçersiz konuşma ID" },
        { status: 400 }
      );
    }

    // Mesaj veya dosya kontrolü
    if (!message?.trim() && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: "Mesaj içeriği veya dosya zorunludur" },
        { status: 400 }
      );
    }

    // Konuşmayı bul ve yetki kontrolü yap
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, parseInt(conversationId)),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Konuşma bulunamadı" },
        { status: 404 }
      );
    }

    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json(
        { error: "Bu konuşmaya mesaj gönderme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Dosyaları yükle
    const uploadedFiles: string[] = [];
    const fileTypes: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const multerFile = {
            fieldname: 'files',
            originalname: file.name,
            encoding: '7bit',
            mimetype: file.type,
            buffer: buffer,
            size: file.size,
            destination: '',
            filename: file.name,
            path: ''
          };

          try {
            const uploadedFile = await uploadMessageFile(multerFile);
            if (uploadedFile) {
              uploadedFiles.push(uploadedFile);
              fileTypes.push(getFileType(file.name));
            }
          } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            // Dosya yükleme hatası olsa bile devam et
          }
        }
      }
    }

    // Mesajı oluştur
    const sanitizedMessage = sanitizeInput(message?.trim() || '');
    const receiverId = conversation.senderId === userId 
      ? conversation.receiverId 
      : conversation.senderId;

    const newMessage = await storage.createMessage(
      parseInt(conversationId),
      userId,
      sanitizedMessage,
      request.ip || '0.0.0.0',
      uploadedFiles,
      fileTypes
    );

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
    return NextResponse.json(
      { error: "Mesaj gönderilemedi" },
      { status: 500 }
    );
  }
} 