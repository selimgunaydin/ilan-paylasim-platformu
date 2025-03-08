
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { categories, listings } from "@shared/schema";
import { Express } from "express";

// Kategori silme işlemleri için yardımcı fonksiyonlar
export const setupCategoryDeleteRoutes = (app: Express) => {
  // Bir kategorinin silinebilir olup olmadığını kontrol eden endpoint
  app.get("/api/admin/categories/:id/can-delete", async (req, res) => {
    if (!req.session?.adminId) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const categoryId = parseInt(req.params.id);
      
      // Kategori kontrolü
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!category.length) {
        return res.status(404).json({ error: "Kategori bulunamadı" });
      }

      // İlan kontrolü
      const listings_count = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.categoryId, categoryId));

      // Alt kategori kontrolü
      const subcategories = await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, categoryId));

      const canDelete = listings_count[0].count === 0 && subcategories.length === 0;

      res.json({
        canDelete,
        reason: !canDelete 
          ? listings_count[0].count > 0 
            ? "Bu kategoride ilanlar mevcut" 
            : "Bu kategorinin alt kategorileri mevcut"
          : null
      });
    } catch (error) {
      console.error("Kategori silme kontrolü hatası:", error);
      res.status(500).json({ error: "Kategori kontrolü yapılırken bir hata oluştu" });
    }
  });

  // Kategori silme endpoint'i
  app.delete("/api/admin/categories/:id/force", async (req, res) => {
    if (!req.session?.adminId) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const categoryId = parseInt(req.params.id);

      // Önce kategorinin silinebilir olup olmadığını kontrol et
      const canDeleteResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/categories/${categoryId}/can-delete`);
      const canDeleteData = await canDeleteResponse.json();

      if (!canDeleteData.canDelete) {
        return res.status(400).json({ error: canDeleteData.reason });
      }

      // Kategoriyi sil
      const [deletedCategory] = await db
        .delete(categories)
        .where(eq(categories.id, categoryId))
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({ error: "Kategori bulunamadı" });
      }

      res.json({ success: true, message: "Kategori başarıyla silindi" });
    } catch (error) {
      console.error("Kategori silme hatası:", error);
      res.status(500).json({ error: "Kategori silinirken bir hata oluştu" });
    }
  });
};
