import { Express } from 'express';
import multer from 'multer';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { storage } from '../../storage';
import { sanitizeInput } from '../../utils/sanitize';
import {
  isAllowedFileType,
  getFileSizeLimit,
} from '../../utils/file-constants';
import { sendMessageToUser } from '../index';

export function registerMessageRoutes(app: Express): void {
  // Dosya yükleme konfigürasyonu
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      if (!isAllowedFileType(file.mimetype)) {
        cb(new Error(`Desteklenmeyen dosya türü: ${file.originalname}`));
        return;
      }

      // Dosya boyutu limitini belirle ve request nesnesine ekle
      const sizeLimit = getFileSizeLimit(file.mimetype);
      req.multerFileSizeLimit = sizeLimit;

      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Mesaj gönderme endpoint'i
  app.post("/api/messages", upload.array("files", 5), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      console.log("Yeni mesaj isteği alındı:", {
        conversationId: req.body.conversationId,
        userId: req.user!.id,
        hasFiles: req.files && Array.isArray(req.files) && req.files.length > 0,
        fileDetails: req.files
          ? (req.files as Express.Multer.File[]).map((f) => ({
              originalname: f.originalname,
              size: f.size,
              mimetype: f.mimetype,
            }))
          : [],
      });

      const conversationId = parseInt(req.body.conversationId);
      const message = sanitizeInput(req.body.message?.trim());

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      if (!message && (!req.files || req.files.length === 0)) {
        return res
          .status(400)
          .json({ error: "Mesaj içeriği veya dosya zorunludur" });
      }

      // Get conversation and check permissions
      const [conversation] = await db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.id, conversationId));

      if (!conversation) {
        return res.status(404).json({ error: "Konuşma bulunamadı" });
      }

      if (
        conversation.senderId !== req.user!.id &&
        conversation.receiverId !== req.user!.id
      ) {
        return res
          .status(403)
          .json({ error: "Bu konuşmaya mesaj gönderme yetkiniz yok" });
      }

      // Upload files
      let uploadedFiles: string[] = [];
      let fileTypes: string[] = [];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          const files = req.files as Express.Multer.File[];
          uploadedFiles = await storage.uploadMessageFiles(files);
          fileTypes = files.map((file) => file.mimetype);
        } catch (error) {
          console.error("Dosya yükleme hatası:", error);
          return res.status(500).json({ error: "Dosyalar yüklenemedi" });
        }
      }

      // Create message
      const [newMessage] = await db
        .insert(schema.messages)
        .values({
          conversationId,
          senderId: req.user!.id,
          receiverId:
            conversation.senderId === req.user!.id
              ? conversation.receiverId
              : conversation.senderId,
          message: message || null,
          files: uploadedFiles.length > 0 ? uploadedFiles : null,
          fileTypes: fileTypes.length > 0 ? fileTypes : null,
          read: false,
          createdAt: new Date(),
        })
        .returning();

      if (!newMessage) {
        return res.status(500).json({ error: "Mesaj oluşturulamadı" });
      }

      // Update conversation last message
      await db
        .update(schema.conversations)
        .set({
          lastMessageId: newMessage.id,
          lastMessageAt: newMessage.createdAt,
          lastMessageSenderId: req.user!.id,
        })
        .where(eq(schema.conversations.id, conversationId));

      // Send WebSocket notification to the receiver
      const receiverId =
        conversation.senderId === req.user!.id
          ? conversation.receiverId
          : conversation.senderId;

      sendMessageToUser(receiverId, {
        type: "new_message",
        data: {
          message: newMessage,
          conversationId,
        },
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      res.status(500).json({ error: "Mesaj gönderilemedi" });
    }
  });

  // Konuşma mesajlarını getir
  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      // Check if user is part of the conversation
      const [conversation] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(
              schema.conversations.senderId,
              req.user!.id
            ),
          ),
        );

      const [conversation2] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(
              schema.conversations.receiverId,
              req.user!.id
            ),
          ),
        );

      if (!conversation && !conversation2) {
        return res.status(403).json({ error: "Bu konuşmaya erişim izniniz yok" });
      }

      // Get messages
      const messages = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversationId))
        .orderBy(schema.messages.createdAt);

      // Mark messages as read
      await db
        .update(schema.messages)
        .set({ read: true })
        .where(
          and(
            eq(schema.messages.conversationId, conversationId),
            eq(schema.messages.receiverId, req.user!.id),
            eq(schema.messages.read, false),
          ),
        );

      res.json(messages);
    } catch (error) {
      console.error("Mesajları getirme hatası:", error);
      res.status(500).json({ error: "Mesajlar yüklenemedi" });
    }
  });

  // Mesaj sil
  app.delete("/api/messages/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Geçersiz mesaj ID" });
      }

      // Check if user is the sender of the message
      const [message] = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.id, messageId),
            eq(schema.messages.senderId, req.user!.id),
          ),
        );

      if (!message) {
        return res.status(403).json({ error: "Bu mesajı silme yetkiniz yok" });
      }

      // Delete message files if any
      if (message.files && message.files.length > 0) {
        try {
          await storage.deleteMessageFiles(message.files);
        } catch (error) {
          console.error("Mesaj dosyaları silme hatası:", error);
          // Continue even if file deletion fails
        }
      }

      // Delete message
      await db.delete(schema.messages).where(eq(schema.messages.id, messageId));

      res.json({ success: true });
    } catch (error) {
      console.error("Mesaj silme hatası:", error);
      res.status(500).json({ error: "Mesaj silinemedi" });
    }
  });

  // Mesajı okundu olarak işaretle
  app.patch("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Geçersiz mesaj ID" });
      }

      // Check if user is the receiver of the message
      const [message] = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.id, messageId),
            eq(schema.messages.receiverId, req.user!.id),
          ),
        );

      if (!message) {
        return res.status(403).json({ error: "Bu mesajı okuma yetkiniz yok" });
      }

      // Mark message as read
      await db
        .update(schema.messages)
        .set({ read: true })
        .where(eq(schema.messages.id, messageId));

      res.json({ success: true });
    } catch (error) {
      console.error("Mesaj okundu işaretleme hatası:", error);
      res.status(500).json({ error: "Mesaj okundu olarak işaretlenemedi" });
    }
  });

  // Konuşma dosyalarını getir
  app.get("/api/messages/conversation/:id/files", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      // Check if user is part of the conversation
      const [conversation] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(
              schema.conversations.senderId,
              req.user!.id
            ),
          ),
        );

      const [conversation2] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(
              schema.conversations.receiverId,
              req.user!.id
            ),
          ),
        );

      if (!conversation && !conversation2) {
        return res.status(403).json({ error: "Bu konuşmaya erişim izniniz yok" });
      }

      // Get messages with files
      const messages = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.conversationId, conversationId),
            // Only get messages with files
            // @ts-ignore
            sql`${schema.messages.files} IS NOT NULL`,
          ),
        )
        .orderBy(schema.messages.createdAt);

      // Extract files from messages
      const files = messages.flatMap((message) => {
        if (!message.files) return [];
        return message.files.map((file, index) => ({
          id: `${message.id}_${index}`,
          messageId: message.id,
          path: file,
          type: message.fileTypes?.[index] || "unknown",
          url: storage.getMessageFileUrl(file),
          createdAt: message.createdAt,
        }));
      });

      res.json(files);
    } catch (error) {
      console.error("Dosyaları getirme hatası:", error);
      res.status(500).json({ error: "Dosyalar yüklenemedi" });
    }
  });
} 