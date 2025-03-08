import { eq } from "drizzle-orm";
import { db } from "../db";
import { messages } from "@shared/schema";
import { Router } from "express";
import jwt from 'jsonwebtoken';
import { 
  FILE_SIZE_LIMITS, 
  ALLOWED_IMAGE_TYPES,
  isAllowedFileType, 
  isAllowedFileSize 
} from "../utils/file-constants"; 

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'websocket-secret-key';

// Token istek sınırlaması için Map
const tokenRequestMap = new Map<number, number>();
const TOKEN_REQUEST_COOLDOWN = 5000; // 5 saniye bekleme süresi

// WebSocket token oluşturma endpoint'i
router.get("/ws-token", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Yetkilendirme gerekli" });
  }

  try {
    const userId = req.user!.id;
    const now = Date.now();
    const lastRequest = tokenRequestMap.get(userId) || 0;

    if (now - lastRequest < TOKEN_REQUEST_COOLDOWN) {
      return res.status(429).json({ 
        error: "Token isteği çok sık yapılıyor",
        retryAfter: Math.ceil((TOKEN_REQUEST_COOLDOWN - (now - lastRequest)) / 1000)
      });
    }

    // Son istek zamanını güncelle
    tokenRequestMap.set(userId, now);

    // JWT token oluştur (15 dakika geçerli)
    const token = jwt.sign(
      { 
        userId: userId,
        type: 'websocket',
        timestamp: now
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token });
  } catch (error) {
    console.error("Token oluşturma hatası:", error);
    res.status(500).json({ error: "Token oluşturulamadı" });
  }
});

// WebSocket token doğrulama fonksiyonu
export const verifyWSToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      type: string;
      timestamp: number;
    };

    // Token tipini ve geçerliliğini kontrol et
    if (decoded.type !== 'websocket') {
      console.log('Geçersiz token tipi:', decoded.type);
      return null;
    }

    // Token'ın 15 dakikadan eski olmadığını kontrol et
    const now = Date.now();
    const tokenAge = now - decoded.timestamp;
    if (tokenAge > 15 * 60 * 1000) { // 15 dakika
      console.log('Token süresi dolmuş');
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    return null;
  }
};

// Konuşma dosyalarını getiren endpoint
router.get("/conversation/:conversationId/files", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Yetkilendirme gerekli" });
  }

  try {
    const { conversationId } = req.params;
    console.log("Fetching files for conversation:", conversationId);

    // Dosyaları olan mesajları getir
    const messagesWithFiles = await db
      .select({
        messageId: messages.id,
        fileKey: messages.files,
        fileType: messages.fileTypes,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, parseInt(conversationId)));

    // Dosya bilgilerini işle
    const fileGroups = messagesWithFiles
      .filter((msg) => msg.fileKey && Array.isArray(msg.fileKey) && msg.fileKey.length > 0)
      .map((msg) => ({
        messageId: msg.messageId,
        fileKey: msg.fileKey?.[0] || '', 
        fileType: msg.fileType?.[0] || 'application/octet-stream',
        createdAt: msg.createdAt || new Date(), 
      }))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    console.log("Processed file groups:", fileGroups);
    res.json(fileGroups);
  } catch (error) {
    console.error("Error fetching conversation files:", error);
    res.status(500).json({
      error: "Konuşma dosyaları yüklenemedi",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;