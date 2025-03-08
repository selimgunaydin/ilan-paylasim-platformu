import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../middleware';

export function registerAdminUserRoutes(app: Express): void {
  // Kullanıcıları listele
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // Filtre parametrelerini al
      const { gender, usedAd, status, yuksekUye } = req.query;

      // Temel sorgu oluştur
      let query = db.select().from(schema.users);

      // Filtreleri uygula
      if (gender && gender !== "all") {
        query = query.where(eq(schema.users.gender, gender as string));
      }
      if (usedAd && usedAd !== "all") {
        query = query.where(
          eq(schema.users.used_free_ad, usedAd === "yes" ? 1 : 0),
        );
      }
      if (status && status !== "all") {
        query = query.where(eq(schema.users.status, status as string));
      }
      if (yuksekUye && yuksekUye !== "all") {
        query = query.where(eq(schema.users.yuksekUye, yuksekUye === "yes"));
      }

      const users = await query;
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Kullanıcılar yüklenemedi" });
    }
  });

  // Kullanıcı durumunu güncelleme endpoint'i (ban/unban)
  app.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Geçersiz kullanıcı ID" });
      }

      const [updatedUser] = await db
        .update(schema.users)
        .set({ status })
        .where(eq(schema.users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Kullanıcı durumu güncellenemedi" });
    }
  });

  // Kullanıcı silme endpoint'i
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Geçersiz kullanıcı ID" });
      }

      await db.delete(schema.users).where(eq(schema.users.id, userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Kullanıcı silinemedi" });
    }
  });
} 