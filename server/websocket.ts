import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse, UrlWithParsedQuery } from 'url';
import { verifyWSToken } from './routes/messages';
import { IncomingMessage } from 'http';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
  connectionId?: string; // Benzersiz bağlantı ID'si
  ping: () => void;
  terminate: () => void;
  send: (data: string) => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
  close: (code?: number, reason?: string) => void;
  readyState: number;
}

interface WSClients {
  [userId: number]: Map<string, AuthenticatedWebSocket>; // connectionId -> WebSocket eşlemesi
}

const TOKEN_REQUEST_COOLDOWN = 300000; // Example cooldown in milliseconds (5 minutes)
const tokenRequestMap = new Map<number, number>(); // Assumed type and existence


// Hiç bir şart altında bozulmaması gereken kod!
export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: WSClients = {};
// Hiç bir şart altında bozulmaması gereken kod!
  private pingInterval: NodeJS.Timeout;
  private cleanupInterval: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();

    // Her 30 saniyede bir bağlantı sağlığını kontrol et
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`Yanıt vermeyen bağlantı kapatılıyor. User ID: ${ws.userId}, Connection ID: ${ws.connectionId}`);
          this.cleanupConnection(ws);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    // Her 5 dakikada bir eski token kayıtlarını temizle
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      tokenRequestMap.forEach((timestamp, userId) => {
        if (now - timestamp > TOKEN_REQUEST_COOLDOWN * 2) {
          tokenRequestMap.delete(userId);
          console.log(`Eski token kaydı temizlendi: User ID ${userId}`);
        }
      });
    }, 300000); // 5 dakika
  }

  // Kullanıcı başına maksimum bağlantı sayısı
  private readonly MAX_CONNECTIONS_PER_USER = 3;

  private generateConnectionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupConnection(ws: AuthenticatedWebSocket) {
    if (ws.userId && ws.connectionId) {
      const userConnections = this.clients[ws.userId];
      if (userConnections) {
        userConnections.delete(ws.connectionId);
        if (userConnections.size === 0) {
          delete this.clients[ws.userId];
        }
        console.log(`Bağlantı temizlendi. User ID: ${ws.userId}, Connection ID: ${ws.connectionId}`);
        console.log(`Kalan bağlantılar - Kullanıcı: ${ws.userId}, Sayı: ${userConnections.size}`);
      }
    }
    ws.terminate();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        const { query } = parse(req.url || '', true);
        const token = query.token as string;

        if (!token) {
          console.log('Token eksik, bağlantı reddediliyor');
          ws.close(1008, 'Token gerekli');
          return;
        }

        const decoded = verifyWSToken(token);
        if (!decoded) {
          console.log('Geçersiz token, bağlantı reddediliyor');
          ws.close(1008, 'Geçersiz token');
          return;
        }

        // Kullanıcının mevcut bağlantılarını kontrol et
        if (!this.clients[decoded.userId]) {
          this.clients[decoded.userId] = new Map();
        }

        if (this.clients[decoded.userId].size >= this.MAX_CONNECTIONS_PER_USER) {
          console.log(`Maksimum bağlantı sayısı aşıldı. User ID: ${decoded.userId}`);
          ws.close(1013, 'Maksimum bağlantı sayısı aşıldı');
          return;
        }

        // Yeni bağlantı için benzersiz ID oluştur
        const connectionId = this.generateConnectionId();
        ws.connectionId = connectionId;
        ws.userId = decoded.userId;
        ws.isAlive = true;

        // Bağlantıyı kaydet
        this.clients[decoded.userId].set(connectionId, ws);

        console.log(`WebSocket bağlantısı başarılı. User ID: ${decoded.userId}, Connection ID: ${connectionId}, Total connections: ${this.clients[decoded.userId].size}`);

        // Başlangıç durumunu gönder
        try {
          ws.send(JSON.stringify({
            type: 'connection_status',
            status: 'connected',
            userId: decoded.userId,
            connectionId: connectionId
          }));
        } catch (error) {
          console.error('Bağlantı durumu gönderme hatası:', error);
        }

        // Ping-pong yönetimi
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Mesaj işleme
        ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            console.log('Mesaj alındı:', message);
            this.handleMessage(message, ws);
          } catch (error) {
            console.error('Mesaj işleme hatası:', error);
          }
        });

        // Bağlantı kapanma yönetimi
        ws.on('close', () => {
          console.log(`WebSocket bağlantısı kapandı. User ID: ${ws.userId}, Connection ID: ${ws.connectionId}`);
          this.cleanupConnection(ws);
        });

        // Hata yönetimi
        ws.on('error', (error) => {
          console.error(`WebSocket hatası. User ID: ${ws.userId}, Connection ID: ${ws.connectionId}`, error);
          this.cleanupConnection(ws);
        });

      } catch (error) {
        console.error('WebSocket bağlantı kurulumu hatası:', error);
        ws.close(1011, 'Sunucu hatası');
      }
    });

    // Sunucu kapanma yönetimi
    this.wss.on('close', () => {
      clearInterval(this.pingInterval);
      clearInterval(this.cleanupInterval);
    });
  }

  // Mesaj işleme
  private handleMessage(message: any, ws: AuthenticatedWebSocket) {
    if (!ws.userId) {
      console.error('Kimliği doğrulanmamış bağlantıdan mesaj alındı');
      return;
    }

    if (message.type === 'ping') {
      try {
        ws.send(JSON.stringify({ type: 'pong' }));
        console.log(`Ping yanıtı gönderildi. User ID: ${ws.userId}, Connection ID: ${ws.connectionId}`);
      } catch (error) {
        console.error('Pong yanıtı gönderme hatası:', error);
      }
    } else if (message.type === 'new_message' && message.receiverId) {
      // Mesajı alıcıya ilet
      if (message.receiverId !== ws.userId) {
        const success = this.sendToUser(message.receiverId, {
          type: 'new_message',
          conversationId: message.conversationId,
          message: message.message,
          isSender: false
        });

        if (!success) {
          console.log(`${message.receiverId} ID'li kullanıcı çevrimdışı, mesaj iletilemedi`);
          // Mesaj iletilmedi bilgisini gönderen kullanıcıya bildir
          try {
            ws.send(JSON.stringify({
              type: 'message_delivery_status',
              conversationId: message.conversationId,
              messageId: message.messageId,
              status: 'offline',
              receiverId: message.receiverId
            }));
          } catch (error) {
            console.error('Mesaj durumu bildirimi hatası:', error);
          }
        } else {
          // Mesaj iletildi bilgisini gönderen kullanıcıya bildir
          try {
            ws.send(JSON.stringify({
              type: 'message_delivery_status',
              conversationId: message.conversationId,
              messageId: message.messageId,
              status: 'delivered',
              receiverId: message.receiverId
            }));
          } catch (error) {
            console.error('Mesaj durumu bildirimi hatası:', error);
          }
        }
      }
    } else if (message.type === 'message_read' && message.senderId && message.conversationId) {
      // Mesaj okundu bilgisini gönderene ilet
      const success = this.sendToUser(message.senderId, {
        type: 'message_read',
        conversationId: message.conversationId,
        messageId: message.messageId
      });
      
      if (!success) {
        console.log(`${message.senderId} ID'li kullanıcı çevrimdışı, okundu bilgisi iletilemedi`);
      } else {
        console.log(`Okundu bilgisi iletildi. Mesaj ID: ${message.messageId}, Gönderen ID: ${message.senderId}`);
      }
    }
  }

  // Belirli bir kullanıcıya mesaj gönderme
  public sendToUser(userId: number, message: any) {
    console.log(`${userId} ID'li kullanıcıya mesaj gönderiliyor:`, message);
    const userConnections = this.clients[userId];

    if (!userConnections || userConnections.size === 0) {
      console.log(`${userId} ID'li kullanıcı için aktif bağlantı bulunamadı`);
      return false;
    }

    let sentSuccessfully = false;
    const messageStr = JSON.stringify(message);
    const failedConnections: AuthenticatedWebSocket[] = [];

    for (const [connectionId, client] of userConnections) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          console.log(`Mesaj başarıyla gönderildi. User ID: ${userId}, Connection ID: ${connectionId}`);
          sentSuccessfully = true;
        } catch (error) {
          console.error(`Mesaj gönderme hatası. User ID: ${userId}, Connection ID: ${connectionId}:`, error);
          failedConnections.push(client);
        }
      } else {
        console.log(`Bağlantı hazır değil. User ID: ${userId}, Connection ID: ${connectionId}, State: ${client.readyState}`);
        failedConnections.push(client);
      }
    }

    // Başarısız bağlantıları temizle
    failedConnections.forEach(client => this.cleanupConnection(client));

    return sentSuccessfully;
  }

  // Tüm bağlantılara mesaj yayınlama
  public broadcast(message: any) {
    console.log('Mesaj yayınlanıyor:', message);
    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;

    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          successCount++;
        } catch (error) {
          console.error('Yayın hatası:', error);
          failCount++;
        }
      }
    });

    console.log(`Yayın sonuçları - Başarılı: ${successCount}, Başarısız: ${failCount}`);
    return successCount > 0;
  }

  // Sunucuyu kapat
  public close() {
    clearInterval(this.pingInterval);
    clearInterval(this.cleanupInterval);
    this.wss.close();
  }

  // Bağlantı durumunu kontrol et
  public getConnectionStatus(userId: number): boolean {
    const userConnections = this.clients[userId];
    return Boolean(userConnections && Array.from(userConnections.values()).some(client => client.readyState === WebSocket.OPEN));
  }
}