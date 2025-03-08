import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import passport from 'passport';
import { comparePasswords } from '../../auth';
import { generateVerificationEmail, sendEmail } from '../../services/email';
import { sanitizeInput } from '../../utils/sanitize';
import { isForbiddenUsername } from '../../utils/username-validation';
import { validatePassword } from '../../password-validation';
import { hashPassword } from '../../utils';
import crypto from 'crypto';

export function registerAuthRoutes(app: Express): void {
  // Kullanıcı giriş endpoint'i
  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    try {
      // Update last_seen timestamp
      const ip_address = req.body.ipAddress || "unknown";
      console.log("ip_address", ip_address);
      await db
        .update(schema.users)
        .set({ lastSeen: new Date(), ip_address: ip_address })
        .where(eq(schema.users.id, req.user!.id));

      res.status(200).json(req.user);
    } catch (error) {
      console.error("Error updating last_seen:", error);
      // Still return user data even if last_seen update fails
      res.status(200).json(req.user);
    }
  });

  // Kullanıcı kaydı endpoint'i
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, name, gender } = req.body;

      // Kullanıcı adı ve e-posta kontrolü
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedEmail = sanitizeInput(email);

      if (isForbiddenUsername(sanitizedUsername)) {
        return res.status(400).json({
          message: "Bu kullanıcı adı kullanılamaz",
        });
      }

      // Şifre doğrulama
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          message: passwordValidation.message,
        });
      }

      // Kullanıcı adı ve e-posta kontrolü
      const existingUser = await db.query.users.findFirst({
        where: (users, { or }) =>
          or(
            eq(users.username, sanitizedUsername),
            eq(users.email, sanitizedEmail)
          ),
      });

      if (existingUser) {
        if (existingUser.username === sanitizedUsername) {
          return res.status(400).json({
            message: "Bu kullanıcı adı zaten kullanılıyor",
          });
        }
        if (existingUser.email === sanitizedEmail) {
          return res.status(400).json({
            message: "Bu e-posta adresi zaten kullanılıyor",
          });
        }
      }

      // Şifre hashleme
      const hashedPassword = await hashPassword(password);

      // Doğrulama token'ı oluştur
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenCreatedAt = new Date();

      // Kullanıcıyı veritabanına ekle
      const [newUser] = await db
        .insert(schema.users)
        .values({
          username: sanitizedUsername,
          email: sanitizedEmail,
          password: hashedPassword,
          name: sanitizeInput(name),
          gender: sanitizeInput(gender),
          verificationToken: verificationToken,
          verificationTokenCreatedAt: tokenCreatedAt,
        })
        .returning();

      if (!newUser) {
        return res.status(500).json({
          message: "Kullanıcı oluşturulurken bir hata oluştu",
        });
      }

      // Doğrulama e-postası gönder
      const verificationEmail = generateVerificationEmail(
        sanitizedEmail,
        verificationToken
      );
      await sendEmail(verificationEmail);

      return res.status(201).json({
        message: "Kullanıcı başarıyla oluşturuldu. Lütfen e-postanızı doğrulayın.",
      });
    } catch (error) {
      console.error("Kayıt hatası:", error);
      return res.status(500).json({
        message: "Kayıt işlemi sırasında bir hata oluştu",
      });
    }
  });

  // E-posta doğrulama endpoint'i
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Geçersiz token" });
      }

      // Token ile kullanıcıyı bul
      const user = await db.query.users.findFirst({
        where: eq(schema.users.verificationToken, token),
      });

      if (!user) {
        return res.status(404).json({ message: "Geçersiz doğrulama bağlantısı" });
      }

      // Token'ın süresi dolmuş mu kontrol et
      const now = new Date();
      const tokenCreatedAt = user.verificationTokenCreatedAt;
      
      if (!tokenCreatedAt) {
        return res.status(400).json({ message: "Geçersiz doğrulama bağlantısı" });
      }
      
      const tokenAge = now.getTime() - tokenCreatedAt.getTime();
      const tokenMaxAge = 24 * 60 * 60 * 1000; // 24 saat
      
      if (tokenAge > tokenMaxAge) {
        return res.status(400).json({ message: "Doğrulama bağlantısının süresi dolmuş" });
      }

      // Kullanıcıyı doğrulanmış olarak işaretle
      await db
        .update(schema.users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenCreatedAt: null,
        })
        .where(eq(schema.users.id, user.id));

      return res.json({ message: "E-posta başarıyla doğrulandı" });
    } catch (error) {
      console.error("E-posta doğrulama hatası:", error);
      return res.status(500).json({ message: "Doğrulama sırasında bir hata oluştu" });
    }
  });

  // Kullanıcı çıkış endpoint'i
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Çıkış yapılırken bir hata oluştu" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Oturum sonlandırılırken bir hata oluştu" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Başarıyla çıkış yapıldı" });
      });
    });
  });

  // Kullanıcı bilgilerini getir
  app.get("/api/user", async (req, res) => {
    if (req.user) {
      return res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        type: "user",
      });
    }
    
    if (req.session?.adminId) {
      try {
        const [admin] = await db
          .select()
          .from(schema.admin_users)
          .where(eq(schema.admin_users.id, req.session.adminId));
        if (admin) {
          return res.json({
            id: admin.id,
            username: admin.username,
            type: "admin",
          });
        }
      } catch (error) {
        console.error("Admin fetch error:", error);
        return res.status(500).json({ message: "Admin bilgileri alınamadı" });
      }
    }
    
    return res.sendStatus(401);
  });

  // Kullanıcı hesabını sil
  app.delete("/api/user", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Yetkilendirme hatası" });
    }

    try {
      await db.delete(schema.users).where(eq(schema.users.id, req.user.id));
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
          res.clearCookie("connect.sid");
          return res.json({ message: "Hesap başarıyla silindi" });
        });
      });
    } catch (error) {
      console.error("Hesap silme hatası:", error);
      return res.status(500).json({ message: "Hesap silinirken bir hata oluştu" });
    }
  });
} 