import { Express } from 'express';
import { Server } from 'http';
import { registerUserRoutes } from './user';
import { registerConversationRoutes } from './conversations';
import { registerMessageRoutes } from './messages';
import { registerListingRoutes } from './listings';
import { registerCategoryRoutes } from './categories';
import { registerAdminRoutes } from './admin';
import { registerPaymentRoutes } from './payments';
import { registerFavoriteRoutes } from './favorites';
import { WebSocketManager } from '../websocket';

let wsManager: WebSocketManager | null = null;

export function setWebSocketManager(manager: WebSocketManager) {
  wsManager = manager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}

export function sendMessageToUser(userId: number | string, message: any) {
  if (wsManager) {
    wsManager.sendToUser(userId, message);
  }
}

export function broadcastMessage(type: string, data: any) {
  if (wsManager) {
    wsManager.broadcast({ type, data });
  }
}

export function registerRoutes(app: Express): Server {
  // Tüm route modüllerini kaydet
  registerUserRoutes(app);
  registerConversationRoutes(app);
  registerMessageRoutes(app);
  registerListingRoutes(app);
  registerCategoryRoutes(app);
  registerAdminRoutes(app);
  registerPaymentRoutes(app);
  registerFavoriteRoutes(app);

  // HTTP sunucusunu oluştur ve döndür
  const server = new Server(app);
  return server;
}

// WebSocket token doğrulama fonksiyonunu dışa aktar
export { verifyWSToken } from '../utils/token';

// Ortak tipleri dışa aktar
export * from './types'; 