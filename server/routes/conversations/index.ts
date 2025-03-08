import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { storage } from '../../storage';

export function registerConversationRoutes(app: Express): void {
  // Konuşma oluşturma/bulma endpoint'i
  app.post("/api/conversations/find", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.setHeader("Content-Type", "application/json");
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const listingId = parseInt(req.body.listingId);
      const receiverId = parseInt(req.body.receiverId);

      if (isNaN(listingId) || isNaN(receiverId)) {
        res.setHeader("Content-Type", "application/json");
        return res
          .status(400)
          .json({ error: "Geçersiz ilan ID veya alıcı ID" });
      }

      console.log("Konuşma arama parametreleri:", {
        listingId,
        receiverId,
        senderId: req.user!.id,
      });

      // Önce mevcut konuşmayı bul
      let conversation = await storage.findConversation(
        listingId,
        req.user!.id,
        receiverId,
      );

      // Konuşma yoksa yeni bir konuşma oluştur
      if (!conversation) {
        conversation = await storage.createConversation(
          listingId,
          req.user!.id,
          receiverId,
        );
      }

      console.log("Başarılı konuşma yanıtı:", conversation);
      res.setHeader("Content-Type", "application/json");
      res.json(conversation);
    } catch (error) {
      console.error("Error finding/creating conversation:", error);
      res.setHeader("Content-Type", "application/json");
      res.status(500).json({ error: "Konuşma başlatılamadı" });
    }
  });

  // Gönderilen konuşmaları getir
  app.get("/api/conversations/sent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversations = await storage.getSentConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching sent conversations:", error);
      res.status(500).json({ error: "Gönderilen konuşmalar yüklenemedi" });
    }
  });

  // Alınan konuşmaları getir
  app.get("/api/conversations/received", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversations = await storage.getReceivedConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching received conversations:", error);
      res.status(500).json({ error: "Alınan konuşmalar yüklenemedi" });
    }
  });

  // Konuşma detaylarını getir
  app.get("/api/conversations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      const conversation = await storage.getConversationById(
        conversationId,
        req.user!.id
      );

      if (!conversation) {
        return res.status(404).json({ error: "Konuşma bulunamadı" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Konuşma yüklenemedi" });
    }
  });

  // Konuşma sil
  app.delete("/api/conversations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      // Konuşmayı kontrol et
      const conversation = await storage.getConversationById(
        conversationId,
        req.user!.id
      );

      if (!conversation) {
        return res.status(404).json({ error: "Konuşma bulunamadı" });
      }

      // Konuşmayı sil
      await storage.deleteConversation(conversationId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Konuşma silinemedi" });
    }
  });

  // Konuşmayı okundu olarak işaretle
  app.patch("/api/conversations/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      // Konuşmayı okundu olarak işaretle
      await storage.markConversationAsRead(conversationId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ error: "Konuşma okundu olarak işaretlenemedi" });
    }
  });

  // Konuşmayı okundu olarak işaretle (alternatif)
  app.post("/api/conversations/:id/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      // Konuşmayı okundu olarak işaretle
      await storage.markConversationAsRead(conversationId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ error: "Konuşma okundu olarak işaretlenemedi" });
    }
  });

  // Konuşma olaylarını getir
  app.get("/api/conversations/:id/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Geçersiz konuşma ID" });
      }

      // Konuşma olaylarını getir
      const events = await storage.getConversationEvents(
        conversationId,
        req.user!.id
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching conversation events:", error);
      res.status(500).json({ error: "Konuşma olayları yüklenemedi" });
    }
  });
} 