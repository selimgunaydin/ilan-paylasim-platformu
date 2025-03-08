import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendMessageToUser, broadcastMessage } from '../../../../server/routes';
import { getToken } from 'next-auth/jwt';
// JWT token kontrolü


// WebSocket bildirim API'si
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
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

    // Bildirim verilerini al
    const body = await request.json();
    const { type, senderId, receiverId, conversationId, message, data } = body;

    // Bildirim tipine göre işlem yap
    if (type === 'new_message' && receiverId) {
      // Yeni mesaj bildirimi
      sendMessageToUser(receiverId, {
        type: 'new_message',
        conversationId,
        message,
        isSender: false
      });

      // Ayrıca gönderen kişiye de bildir (çoklu cihaz senkronizasyonu için)
      if (senderId && senderId !== userId) {
        sendMessageToUser(senderId, {
          type: 'new_message',
          conversationId,
          message,
          isSender: true
        });
      }
      
      return NextResponse.json({ success: true });
    } 
    else if (type === 'message_read' && message) {
      // Mesaj okundu bildirimi
      if (message.senderId) {
        sendMessageToUser(message.senderId, {
          type: 'message_read',
          messageId: message.id,
          conversationId: message.conversationId
        });
      }
      
      return NextResponse.json({ success: true });
    }
    else if (type === 'message_deleted') {
      // Mesaj silme bildirimi
      broadcastMessage('message_deleted', {
        conversationId,
        messageId: message?.id
      });
      
      return NextResponse.json({ success: true });
    }
    else if (type === 'broadcast' && data) {
      // Genel yayın
      broadcastMessage(type, data);
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: "Geçersiz bildirim tipi" },
      { status: 400 }
    );
  } catch (error) {
    console.error("WebSocket bildirim hatası:", error);
    return NextResponse.json(
      { error: "Bildirim gönderilemedi" },
      { status: 500 }
    );
  }
} 