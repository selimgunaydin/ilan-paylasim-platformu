import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../../storage';

export function registerFavoriteRoutes(app: Express): void {
  // Favori ekle
  app.post("/api/favorites", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { listingId } = req.body;
      if (!listingId) {
        return res.status(400).json({ error: "Listing ID gerekli" });
      }

      const favorite = await storage.addToFavorites(req.user!.id, listingId);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Favorilere eklenemedi" });
    }
  });

  // Favori sil
  app.delete("/api/favorites/:listingId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz listing ID" });
      }

      await storage.removeFromFavorites(req.user!.id, listingId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Favorilerden çıkarılamadı" });
    }
  });

  // Favori kontrolü
  app.get("/api/favorites/check/:listingId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz listing ID" });
      }

      const isFavorite = await storage.isFavorite(req.user!.id, listingId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ error: "Favori durumu kontrol edilemedi" });
    }
  });

  // Favorileri listele
  app.get("/api/favorites", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const favorites = await db
        .select({
          listing: schema.listings,
          category: schema.categories,
        })
        .from(schema.favorites)
        .innerJoin(
          schema.listings,
          eq(schema.favorites.listingId, schema.listings.id),
        )
        .leftJoin(
          schema.categories,
          eq(schema.listings.categoryId, schema.categories.id),
        )
        .where(eq(schema.favorites.userId, req.user!.id));

      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Favoriler yüklenemedi" });
    }
  });
} 