import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import { storage } from '../../storage';
import { sanitizeInput, sanitizeObject } from '../../utils/sanitize';
import { isForbiddenUsername } from '../../utils/username-validation';
import {
  ALLOWED_IMAGE_TYPES,
  isAllowedFileType,
  getFileSizeLimit,
} from '../../utils/file-constants';
import { deleteMessageFile } from '../../storage';

export function registerProfileRoutes(app: Express): void {
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

  // Profil resmi silme endpoint'i
  app.delete("/api/user/profile-image", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      // Kullanıcıyı bul
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, req.user!.id));

      if (!user || !user.profileImage) {
        return res.status(404).json({ error: "Profil resmi bulunamadı" });
      }

      // Cloudflare R2'den resmi sil
      try {
        await deleteMessageFile(user.profileImage);
      } catch (error) {
        console.error("Profil resmi silme hatası:", error);
        // Cloudflare silme hatası olsa bile devam et
      }

      // Kullanıcının profil resmini veritabanından temizle
      await db
        .update(schema.users)
        .set({ profileImage: null })
        .where(eq(schema.users.id, req.user!.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Profil resmi silme hatası:", error);
      res.status(500).json({ error: "Profil resmi silinemedi" });
    }
  });

  // Profil resmi yükleme endpoint'i
  app.post("/api/user/avatar", upload.single("avatar"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Dosya yüklenemedi" });
    }

    try {
      // Dosya türünü kontrol et
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Desteklenmeyen dosya türü" });
      }

      // Kullanıcının avatar bilgisini güncelle
      const [updatedUser] = await db
        .update(schema.users)
        .set({ avatar: req.file.path })
        .where(eq(schema.users.id, req.user!.id))
        .returning();

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Avatar güncelleme hatası:", error);
      res.status(500).json({ error: "Avatar güncellenemedi" });
    }
  });

  // Profil güncelleme endpoint'i
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const sanitizedInput = sanitizeObject({
        username: req.body.username,
        profileImage: req.body.profileImage,
        profileVisibility: req.body.profileVisibility,
        gender: req.body.gender,
        age: req.body.age,
        city: req.body.city,
        aboutMe: req.body.aboutMe,
      });

      // Yasaklı kullanıcı adı kontrolü
      if (
        sanitizedInput.username &&
        isForbiddenUsername(sanitizedInput.username)
      ) {
        return res.status(400).json({ error: "Bu kullanıcı adı kullanılamaz" });
      }

      // Kullanıcı bilgilerini güncelle
      const [updatedUser] = await db
        .update(schema.users)
        .set(sanitizedInput)
        .where(eq(schema.users.id, req.user!.id))
        .returning();

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      res.status(500).json({ error: "Profil güncellenemedi" });
    }
  });
} 