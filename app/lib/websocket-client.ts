// WebSocket istemci işlemleri

/**
 * WebSocket bağlantı durumu
 */
export enum WebSocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * WebSocket bağlantı seçenekleri
 */
export interface WebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket istemci sınıfı
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenRequestTime = 0;
  private tokenRequestCooldown = 5000; // 5 saniye
  
  public options: Required<WebSocketOptions> = {
    onOpen: () => {},
    onClose: () => {},
    onError: () => {},
    onMessage: () => {},
    autoReconnect: true,
    reconnectInterval: 3000, // 3 saniye
    maxReconnectAttempts: 5
  };
  
  constructor(options?: Partial<WebSocketOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }
  
  /**
   * WebSocket token'ı alır
   */
  private async getToken(): Promise<string> {
    // Token varsa ve 10 dakikadan yeni ise yeniden kullan
    if (this.token && Date.now() - this.tokenRequestTime < 10 * 60 * 1000) {
      return this.token;
    }
    
    // Token istek hız sınırlaması
    const now = Date.now();
    if (now - this.tokenRequestTime < this.tokenRequestCooldown) {
      console.log('Token isteği çok sık yapılıyor, bekleniyor...');
      await new Promise(resolve => setTimeout(resolve, this.tokenRequestCooldown));
    }
    
    try {
      this.tokenRequestTime = Date.now();
      const response = await fetch('/api/ws-token', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(`Token alınamadı: ${response.status} - ${errorData.error || 'Bilinmeyen hata'}`);
      }
      
      const data = await response.json();
      this.token = data.token;
      
      if (!this.token) {
        throw new Error('Geçersiz token');
      }
      
      return this.token;
    } catch (error) {
      console.error('WebSocket token alma hatası:', error);
      throw error;
    }
  }
  
  /**
   * WebSocket bağlantısını başlatır
   */
  public async connect(): Promise<void> {
    // Zaten bağlıysa veya bağlanıyorsa işlem yapma
    if (this.status === WebSocketStatus.CONNECTED) return;
    if (this.status === WebSocketStatus.CONNECTING) {
      console.log('WebSocket zaten bağlanıyor...');
      return;
    }
    
    try {
      this.status = WebSocketStatus.CONNECTING;
      console.log('WebSocket bağlantısı başlatılıyor...');
      
      // Mevcut bağlantıyı temizle
      if (this.ws) {
        try {
          this.ws.onclose = null; // Otomatik yeniden bağlanmayı engelle
          this.ws.close(1000, 'Yeniden bağlanıyor');
          this.ws = null;
        } catch (error) {
          console.error('WebSocket kapatma hatası:', error);
        }
      }
      
      const token = await this.getToken();
      
      // WebSocket URL'i
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);
      
      // Bağlantı olayları
      this.ws.onopen = () => {
        this.status = WebSocketStatus.CONNECTED;
        this.reconnectAttempts = 0;
        console.log('WebSocket bağlantısı başarıyla kuruldu');
        this.options.onOpen();
        
        // Ping göndermeye başla
        this.startPing();
      };
      
      this.ws.onclose = (event) => {
        console.log(`WebSocket bağlantısı kapandı: Kod: ${event.code}, Neden: ${event.reason}, Temiz: ${event.wasClean}`);
        this.status = WebSocketStatus.DISCONNECTED;
        this.options.onClose();
        
        // Sadece anormal kapanmalarda yeniden bağlan
        if (event.code !== 1000 && event.code !== 1001) {
          this.reconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket bağlantı hatası:', error);
        this.status = WebSocketStatus.ERROR;
        this.options.onError(error);
        this.reconnect();
      };
      
      this.ws.onmessage = (event) => {
        try {
          // Pong mesajını kontrol et
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            console.log('Pong alındı');
            return;
          }
          
          // Diğer mesajları işle
          this.options.onMessage(event);
        } catch (error) {
          console.error('WebSocket mesaj işleme hatası:', error);
        }
      };
    } catch (error) {
      this.status = WebSocketStatus.ERROR;
      console.error('WebSocket bağlantı hatası:', error);
      this.reconnect();
    }
  }
  
  /**
   * Düzenli ping göndermeyi başlatır
   */
  private startPing(): void {
    // Her 30 saniyede bir ping gönder
    const pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
          console.log('Ping gönderildi');
        } catch (error) {
          console.error('Ping gönderme hatası:', error);
          clearInterval(pingInterval);
        }
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // WebSocket kapandığında interval'i temizle
    this.ws!.addEventListener('close', () => {
      clearInterval(pingInterval);
    });
  }
  
  /**
   * WebSocket bağlantısını yeniden kurma
   */
  private reconnect(): void {
    if (!this.options.autoReconnect) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Maksimum yeniden bağlanma denemesi aşıldı');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Üstel geri çekilme ile yeniden bağlanma
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`WebSocket yeniden bağlanıyor (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})... ${delay}ms sonra`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Yeniden bağlanma hatası:', error);
      });
    }, delay);
  }
  
  /**
   * Mesaj gönderir
   */
  public send(data: any): boolean {
    if (this.status !== WebSocketStatus.CONNECTED || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('WebSocket mesaj gönderme hatası:', error);
      return false;
    }
  }
  
  /**
   * Bağlantıyı kapatır
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      try {
        this.ws.onclose = null; // Otomatik yeniden bağlanmayı engelle
        this.ws.close(1000, 'Normal closure');
        this.ws = null;
      } catch (error) {
        console.error('WebSocket kapatma hatası:', error);
      }
    }
    
    this.status = WebSocketStatus.DISCONNECTED;
  }
  
  /**
   * Bağlantı durumunu kontrol eder
   */
  public getStatus(): WebSocketStatus {
    if (!this.ws) return WebSocketStatus.DISCONNECTED;
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return WebSocketStatus.CONNECTING;
      case WebSocket.OPEN:
        return WebSocketStatus.CONNECTED;
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return WebSocketStatus.DISCONNECTED;
    }
  }
  
  /**
   * Seçenekleri günceller
   */
  public updateOptions(options: Partial<WebSocketOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

// Tekil WebSocket istemci örneği
let wsClientInstance: WebSocketClient | null = null;

/**
 * Global WebSocket istemcisini alır
 */
export function getWebSocketClient(options?: Partial<WebSocketOptions>): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(options);
  } else if (options) {
    // Mevcut istemciye yeni seçenekler ekle
    wsClientInstance.updateOptions(options);
  }
  
  return wsClientInstance;
} 