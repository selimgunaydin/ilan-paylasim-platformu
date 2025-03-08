import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './use-auth';
import { useRouter } from 'next/navigation';
import { getWebSocketClient, WebSocketStatus, WebSocketOptions } from '@/lib/websocket-client';

// WebSocket mesaj tipleri
export interface WebSocketMessage {
  type: string;
  conversationId: number;
  message?: any;
  messageId?: number;
  receiverId?: number;
  senderId?: number;
  status?: string;
}

// Hiç bir şart altında bozulmaması gereken kod!
export function useWebSocket() {
  const { user } = useAuth();
// Hiç bir şart altında bozulmaması gereken kod!
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const router = useRouter();
  const clientRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  // WebSocket mesajlarını işleme
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket mesajı alındı:', data);
      
      // Son mesaj zamanını güncelle
      setLastMessageTime(Date.now());

      // Mesaj işleme
      window.dispatchEvent(new CustomEvent('websocket-message', { 
        detail: data,
        bubbles: true,
        cancelable: true
      }));

      if (data.type === 'new_message' && !window.location.pathname.startsWith('/sohbetdetay/')) {
        setHasUnreadMessages(true);
      }
    } catch (error) {
      console.error('WebSocket mesaj işleme hatası:', error);
    }
  }, []);

  // WebSocket istemcisini başlatma
  useEffect(() => {
    if (!user) return;

    const options: WebSocketOptions = {
      onOpen: () => {
        console.log('WebSocket bağlantısı başarıyla kuruldu');
        setIsConnected(true);
        processMessageQueue();
      },
      onClose: () => {
        console.log('WebSocket bağlantısı kapandı');
        setIsConnected(false);
      },
      onError: (error) => {
        console.error('WebSocket bağlantı hatası:', error);
        setIsConnected(false);
      },
      onMessage: handleWebSocketMessage,
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    };

    // WebSocket istemcisini oluştur
    clientRef.current = getWebSocketClient(options);
    
    // Bağlantıyı başlat
    clientRef.current.connect().catch(error => {
      console.error('WebSocket bağlantı hatası:', error);
    });

    // Aktivite dinleyicileri
    const updateActivity = () => {
      if (clientRef.current && clientRef.current.getStatus() !== WebSocketStatus.CONNECTED) {
        clientRef.current.connect().catch(error => {
          console.error('WebSocket yeniden bağlantı hatası:', error);
        });
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'mousemove', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });
    
    // Düzenli bağlantı kontrolü
    const connectionCheckInterval = setInterval(() => {
      if (clientRef.current && clientRef.current.getStatus() !== WebSocketStatus.CONNECTED) {
        console.log('Düzenli bağlantı kontrolü: Bağlantı kopmuş, yeniden bağlanılıyor...');
        clientRef.current.connect().catch(error => {
          console.error('WebSocket yeniden bağlantı hatası:', error);
        });
      }
    }, 30000); // 30 saniyede bir kontrol et

    // Cleanup
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }

      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      
      clearInterval(connectionCheckInterval);
    };
  }, [user, handleWebSocketMessage]);

  // Mesaj kuyruğu işleme
  const processMessageQueue = useCallback(() => {
    if (clientRef.current && clientRef.current.getStatus() === WebSocketStatus.CONNECTED && messageQueueRef.current.length > 0) {
      while (messageQueueRef.current.length > 0) {
        const message = messageQueueRef.current.shift();
        if (message) {
          try {
            const success = clientRef.current.send(message);
            if (success) {
              console.log('Kuyruktan mesaj gönderildi:', message);
            } else {
              console.error('Kuyruktan mesaj gönderme başarısız:', message);
              messageQueueRef.current.unshift(message);
              break;
            }
          } catch (error) {
            console.error('Kuyruktan mesaj gönderme hatası:', error);
            messageQueueRef.current.unshift(message);
            break;
          }
        }
      }
    }
  }, []);

  // Mesaj gönderme fonksiyonu
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (clientRef.current && clientRef.current.getStatus() === WebSocketStatus.CONNECTED) {
      try {
        const success = clientRef.current.send(message);
        if (success) {
          console.log('Mesaj gönderildi:', message);
          return true;
        } else {
          console.log('Mesaj gönderilemedi, kuyruğa alındı:', message);
          messageQueueRef.current.push(message);
          return false;
        }
      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        messageQueueRef.current.push(message);
        return false;
      }
    } else {
      console.log('Socket hazır değil, mesaj kuyruğa alındı:', message);
      messageQueueRef.current.push(message);
      
      // Bağlantı yoksa yeniden bağlanmayı dene
      if (clientRef.current && clientRef.current.getStatus() !== WebSocketStatus.CONNECTING) {
        clientRef.current.connect().catch(error => {
          console.error('WebSocket yeniden bağlantı hatası:', error);
        });
      }
      
      return false;
    }
  }, []);

  return { 
    sendMessage,
    isConnected,
    hasUnreadMessages,
    setHasUnreadMessages,
    lastMessageTime,
    connect: useCallback(() => {
      if (clientRef.current) {
        return clientRef.current.connect();
      }
      return Promise.reject(new Error('WebSocket istemcisi başlatılmadı'));
    }, [])
  };
}