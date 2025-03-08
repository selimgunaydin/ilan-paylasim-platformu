import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { comparePasswords } from '../../auth';

export function registerAdminAuthRoutes(app: Express): void {
  // Admin giriş endpoint'i
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      console.log("Admin login attempt for username:", username);
      const [result] = await db
        .select()
        .from(schema.admin_users)
        .where(eq(schema.admin_users.username, username));

      if (!result) {
        console.log("Admin user not found:", username);
        return res
          .status(401)
          .json({ message: "Hatalı kullanıcı adı veya şifre" });
      }

      const isValid = await comparePasswords(password, result.password);
      if (!isValid) {
        console.log("Invalid password for admin:", username);
        return res
          .status(401)
          .json({ message: "Hatalı kullanıcı adı veya şifre" });
      }

      // Admin oturumunu başlat
      req.session.adminId = result.id;
      req.session.isAdmin = true;
      
      return res.json({
        id: result.id,
        username: result.username,
        type: "admin",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
    }
  });

  // Admin bilgilerini getir
  app.get("/api/admin/user", async (req, res) => {
    if (req.session?.adminId && req.session?.isAdmin) {
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
} 