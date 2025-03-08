import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';
import { storage } from '../../storage';

export function registerCategoryRoutes(app: Express): void {
  // İlan kategorilerini getir
  app.get("/api/listings/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Tüm kategorileri getir
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();

      // Get listing counts efficiently with a single query
      const countResults = await db
        .select({
          categoryId: schema.listings.categoryId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.listings)
        .where(
          and(
            eq(schema.listings.approved, true),
            eq(schema.listings.active, true),
          ),
        )
        .groupBy(schema.listings.categoryId);

      // Create an efficient lookup map
      const countsMap = Object.fromEntries(
        countResults.map((r) => [r.categoryId, r.count]),
      );

      // Map categories with counts, only adding listingCount if > 0
      const categoriesWithCount = categories.map((category) => {
        const count = countsMap[category.id];
        return count ? { ...category, listingCount: count } : category;
      });

      res.json(categoriesWithCount);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Kategori detaylarını getir
  app.get("/api/categories/:slug", async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category)
      return res.status(404).json({ error: "Kategori bulunamadı" });
    res.json(category);
  });
} 