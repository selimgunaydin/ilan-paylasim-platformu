import { Server, Socket } from 'socket.io';
import { db } from './shared/db'; // .js uzantısını ekleyelim
import { messages, conversations } from './shared/schemas'; // .js uzantısını ekleyelim
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

// Socket tipini genişleterek userId ekleyelim
interface SocketWithAuth extends Socket {
  userId?: string;
}

// NEXTAUTH_SECRET kontrolü
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('HATA: NEXTAUTH_SECRET veya JWT_SECRET tanımlanmamış! Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

const io = new Server(3001, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});

// Her kullanıcı için oda (conversationId) yönetimi
io.on('connection', (socket: SocketWithAuth) => {
  console.log('Yeni bir istemci bağlandı:', socket.id);
  
  // Bağlantı sırasında auth token'ı kontrol et
  try {
    const token = socket.handshake.auth?.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === 'object' && decoded.sub) {
        socket.userId = decoded.sub;
        console.log(`Kullanıcı doğrulandı: ${socket.userId}`);
      }
    } else {
      // Token yoksa authenticate event bekle
      console.log('Token bulunamadı, authenticate olayı bekleniyor...');
    }
  } catch (error) {
    console.error('Kimlik doğrulama hatası:', error);
    // Bağlantıyı hemen kesme, authenticate event ile tekrar denenebilir
  }

  // Kullanıcı kimlik doğrulaması (örneğin, token ile)
  socket.on('authenticate', async (token: string) => {
    try {
      if (!token) {
        throw new Error('Token sağlanmadı');
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === 'object' && decoded.sub) {
        socket.userId = decoded.sub;
        console.log(`Kullanıcı doğrulandı: ${socket.userId}`);
      } else {
        throw new Error('Geçersiz token formatı');
      }
    } catch (error) {
      console.error('Kimlik doğrulama hatası:', error);
      socket.disconnect();
    }
  });

  // Kullanıcı bir konuşmaya katıldığında
  socket.on('joinConversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Kullanıcı ${socket.userId || 'bilinmeyen'} konuşmaya katıldı: ${conversationId}`);
  });

  // Mesaj gönderme
  socket.on('sendMessage', async (data: { conversationId: string, content: string, files?: any, receiverId: number }) => {
    const { conversationId, content, files } = data;

    if (!socket.userId) {
      socket.emit('error', 'Kimlik doğrulama gerekli');
      return;
    }

    try {
      // Mesajı veritabanına kaydet
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId: parseInt(conversationId),
          senderId: parseInt(socket.userId),
          receiverId: data.receiverId, // Alıcı ID'sini istemciden alacağız
          content,
          files,
          createdAt: new Date(),
          isRead: false,
        })
        .returning();

      // Mesajı ilgili konuşmadaki tüm istemcilere gönder
      io.to(conversationId).emit('newMessage', newMessage);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      socket.emit('error', 'Mesaj gönderilemedi');
    }
  });

  // Mesaj okundu işaretleme
  socket.on('markAsRead', async (conversationId: string) => {
    if (!socket.userId) {
      socket.emit('error', 'Kimlik doğrulama gerekli');
      return;
    }
    
    try {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.conversationId, parseInt(conversationId)));

      io.to(conversationId).emit('messageRead', { conversationId });
    } catch (error) {
      console.error('Mesaj okundu işaretlenirken hata:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Bir istemci ayrıldı:', socket.id);
  });
});

console.log('Socket.IO sunucusu 3001 portunda çalışıyor');