import { Express } from 'express';
import multer from 'multer';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { storage } from '../../storage';
import { sanitizeObject } from '../../utils/sanitize';
import {
  isAllowedFileType,
  getFileSizeLimit,
  ALLOWED_IMAGE_TYPES,
} from '../../utils/file-constants';
import { ImageService } from '../types';

export function registerListingRoutes(app: Express): void {
  // Dosya yükleme konfigürasyonu
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
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

  // Resim servisi
  const imageService: ImageService = {
    uploadMultipleImages: async (files: Express.Multer.File[]) => {
      return await storage.uploadListingImages(files);
    },
    deleteMultipleImages: async (imagePaths: string[]) => {
      await storage.deleteListingImages(imagePaths);
    },
    deleteSingleImage: async (imagePath: string) => {
      await storage.deleteListingImage(imagePath);
    },
  };

  // İlan oluşturma endpoint'i
  app.post("/api/listings", upload.array("images", 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const sanitizedInput = sanitizeObject({
        title: req.body.title,
        description: req.body.description,
        city: req.body.city,
        categoryId: req.body.categoryId,
        listingType: req.body.listingType,
        contactPerson: req.body.contactPerson,
        phone: req.body.phone,
      });

      const {
        title,
        description,
        city,
        categoryId,
        listingType,
        contactPerson,
        phone,
      } = sanitizedInput;

      if (!title || !description || !city || !categoryId) {
        return res.status(400).json({ error: "Zorunlu alanları doldurunuz" });
      }

      // Resimleri yükle
      let imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          imageUrls = await imageService.uploadMultipleImages(req.files);
        } catch (error: any) {
          return res.status(400).json({ error: error.message });
        }
      }

      // Enhanced free listing validation
      if (listingType === "standard") {
        // Get user's current status including active listings
        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, req.user!.id));

        if (user.used_free_ad === 1) {
          console.log(
            `User ${user.id} attempted to create standard listing but has used_free_ad=1`,
          );
          return res.status(400).json({
            error:
              "Ücretsiz ilan hakkınızı kullanmışsınız. Sadece öncelikli (premium) ilan verebilirsiniz.",
          });
        }

        // Check if user has any active listings
        const [existingListing] = await db
          .select()
          .from(schema.listings)
          .where(
            and(
              eq(schema.listings.userId, req.user!.id),
              eq(schema.listings.active, true),
              eq(schema.listings.listingType, "standard"),
            ),
          );

        if (existingListing) {
          console.log(
            `User ${req.user!.id} attempted to create standard listing but already has active standard listing ${existingListing.id}`,
          );
          return res.status(400).json({
            error:
              "Zaten aktif bir ücretsiz ilanınız var. Yeni bir ilan vermek için aktif ilanınızı silin veya öncelikli (premium) ilan verin.",
          });
        }

        // Mark user as having used their free ad
        await db
          .update(schema.users)
          .set({ used_free_ad: 1 })
          .where(eq(schema.users.id, req.user!.id));
      }

      // İlanı oluştur
      const [listing] = await db
        .insert(schema.listings)
        .values({
          title,
          description,
          city,
          categoryId: parseInt(categoryId as string),
          listingType: listingType || "standard",
          contactPerson: contactPerson || req.user!.username,
          phone: phone || "",
          userId: req.user!.id,
          images: imageUrls,
          active: listingType === "premium" ? false : true, // Premium ilanlar ödeme sonrası aktif olur
          approved: listingType === "premium" ? false : true, // Premium ilanlar ödeme sonrası onaylanır
          paymentStatus: listingType === "premium" ? "pending" : "not_required",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(listing);
    } catch (error) {
      console.error("İlan oluşturma hatası:", error);
      res.status(500).json({ error: "İlan oluşturulamadı" });
    }
  });

  // İlan güncelleme endpoint'i
  app.put("/api/listings/:id", upload.array("images", 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz ilan ID" });
      }

      // İlanı kontrol et
      const [listing] = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, listingId));

      if (!listing) {
        return res.status(404).json({ error: "İlan bulunamadı" });
      }

      if (listing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Bu ilanı düzenleme yetkiniz yok" });
      }

      const sanitizedInput = sanitizeObject({
        title: req.body.title,
        description: req.body.description,
        city: req.body.city,
        categoryId: req.body.categoryId,
        contactPerson: req.body.contactPerson,
        phone: req.body.phone,
      });

      // Mevcut resimleri kontrol et
      let currentImages = listing.images || [];
      const keepImages = req.body.keepImages
        ? Array.isArray(req.body.keepImages)
          ? req.body.keepImages
          : [req.body.keepImages]
        : [];

      // Silinecek resimleri belirle
      const imagesToDelete = currentImages.filter(
        (img) => !keepImages.includes(img),
      );

      // Silinecek resimleri sil
      if (imagesToDelete.length > 0) {
        await imageService.deleteMultipleImages(imagesToDelete);
      }

      // Yeni resimleri yükle
      let newImages: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          newImages = await imageService.uploadMultipleImages(req.files);
        } catch (error: any) {
          return res.status(400).json({ error: error.message });
        }
      }

      // Tüm resimleri birleştir
      const updatedImages = [...keepImages, ...newImages];

      // İlanı güncelle
      const [updatedListing] = await db
        .update(schema.listings)
        .set({
          ...sanitizedInput,
          categoryId: sanitizedInput.categoryId
            ? parseInt(sanitizedInput.categoryId as string)
            : listing.categoryId,
          images: updatedImages,
          updatedAt: new Date(),
        })
        .where(eq(schema.listings.id, listingId))
        .returning();

      res.json(updatedListing);
    } catch (error) {
      console.error("İlan güncelleme hatası:", error);
      res.status(500).json({ error: "İlan güncellenemedi" });
    }
  });

  // İlan silme endpoint'i
  app.delete("/api/listings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz ilan ID" });
      }

      // İlanı kontrol et
      const [listing] = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, listingId));

      if (!listing) {
        return res.status(404).json({ error: "İlan bulunamadı" });
      }

      if (listing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Bu ilanı silme yetkiniz yok" });
      }

      // İlan resimlerini sil
      if (listing.images && listing.images.length > 0) {
        await imageService.deleteMultipleImages(listing.images);
      }

      // İlanı sil
      await db.delete(schema.listings).where(eq(schema.listings.id, listingId));

      // Eğer standart ilan ise kullanıcının ücretsiz ilan hakkını geri ver
      if (listing.listingType === "standard") {
        await db
          .update(schema.users)
          .set({ used_free_ad: 0 })
          .where(eq(schema.users.id, req.user!.id));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("İlan silme hatası:", error);
      res.status(500).json({ error: "İlan silinemedi" });
    }
  });

  // İlan detaylarını getir
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz ilan ID" });
      }

      // İlanı getir
      const [listing] = await db
        .select({
          listing: schema.listings,
          category: schema.categories,
          user: {
            id: schema.users.id,
            username: schema.users.username,
            profileImage: schema.users.profileImage,
            createdAt: schema.users.createdAt,
          },
        })
        .from(schema.listings)
        .leftJoin(
          schema.categories,
          eq(schema.listings.categoryId, schema.categories.id),
        )
        .leftJoin(schema.users, eq(schema.listings.userId, schema.users.id))
        .where(eq(schema.listings.id, listingId));

      if (!listing) {
        return res.status(404).json({ error: "İlan bulunamadı" });
      }

      res.json(listing);
    } catch (error) {
      console.error("İlan getirme hatası:", error);
      res.status(500).json({ error: "İlan yüklenemedi" });
    }
  });

  // İlanları listele
  app.get("/api/listings", async (req, res) => {
    try {
      const { categoryId, city, search, page = "1", limit = "10" } = req.query;
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const offset = (pageNumber - 1) * limitNumber;

      // Temel sorgu
      let query = db
        .select({
          listing: schema.listings,
          category: schema.categories,
          user: {
            id: schema.users.id,
            username: schema.users.username,
          },
        })
        .from(schema.listings)
        .leftJoin(
          schema.categories,
          eq(schema.listings.categoryId, schema.categories.id),
        )
        .leftJoin(schema.users, eq(schema.listings.userId, schema.users.id))
        .where(
          and(
            eq(schema.listings.active, true),
            eq(schema.listings.approved, true),
          ),
        );

      // Filtreleri uygula
      if (categoryId) {
        query = query.where(
          eq(schema.listings.categoryId, parseInt(categoryId as string)),
        );
      }

      if (city) {
        query = query.where(eq(schema.listings.city, city as string));
      }

      if (search) {
        // Basit arama - daha gelişmiş arama için tam metin araması eklenebilir
        query = query.where(
          sql`${schema.listings.title} ILIKE ${'%' + search + '%'} OR ${schema.listings.description} ILIKE ${'%' + search + '%'}`,
        );
      }

      // Öncelikli ilanları üstte göster
      query = query.orderBy(
        desc(schema.listings.listingType),
        desc(schema.listings.createdAt),
      );

      // Sayfalama
      query = query.limit(limitNumber).offset(offset);

      // Sorguyu çalıştır
      const listings = await query;

      // Toplam ilan sayısını getir
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.listings)
        .where(
          and(
            eq(schema.listings.active, true),
            eq(schema.listings.approved, true),
          ),
        );

      res.json({
        listings,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(count / limitNumber),
        },
      });
    } catch (error) {
      console.error("İlanları getirme hatası:", error);
      res.status(500).json({ error: "İlanlar yüklenemedi" });
    }
  });

  // Kullanıcının ilanlarını getir
  app.get("/api/listings/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listings = await db
        .select({
          listing: schema.listings,
          category: schema.categories,
        })
        .from(schema.listings)
        .leftJoin(
          schema.categories,
          eq(schema.listings.categoryId, schema.categories.id),
        )
        .where(eq(schema.listings.userId, req.user!.id))
        .orderBy(desc(schema.listings.createdAt));

      res.json(listings);
    } catch (error) {
      console.error("Kullanıcı ilanları getirme hatası:", error);
      res.status(500).json({ error: "İlanlar yüklenemedi" });
    }
  });

  // İlanı aktifleştir
  app.put("/api/listings/:id/activate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz ilan ID" });
      }

      // İlanı kontrol et
      const [listing] = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, listingId));

      if (!listing) {
        return res.status(404).json({ error: "İlan bulunamadı" });
      }

      if (listing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Bu ilanı aktifleştirme yetkiniz yok" });
      }

      // İlanı aktifleştir
      const [updatedListing] = await db
        .update(schema.listings)
        .set({ active: true, updatedAt: new Date() })
        .where(eq(schema.listings.id, listingId))
        .returning();

      res.json(updatedListing);
    } catch (error) {
      console.error("İlan aktifleştirme hatası:", error);
      res.status(500).json({ error: "İlan aktifleştirilemedi" });
    }
  });

  // İlanı deaktifleştir
  app.put("/api/listings/:id/deactivate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz ilan ID" });
      }

      // İlanı kontrol et
      const [listing] = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, listingId));

      if (!listing) {
        return res.status(404).json({ error: "İlan bulunamadı" });
      }

      if (listing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Bu ilanı deaktifleştirme yetkiniz yok" });
      }

      // İlanı deaktifleştir
      const [updatedListing] = await db
        .update(schema.listings)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(schema.listings.id, listingId))
        .returning();

      res.json(updatedListing);
    } catch (error) {
      console.error("İlan deaktifleştirme hatası:", error);
      res.status(500).json({ error: "İlan deaktifleştirilemedi" });
    }
  });
} 