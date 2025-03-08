import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";

// Session tipini genişlet
declare module "express-session" {
  interface Session {
    adminId?: number;
    isAdmin?: boolean;
    lastIP?: string;
  }
}

// Hiç bir şart altında bozulmaması gereken kod!
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Sadece /yonetim/* yollarını kontrol et
// Hiç bir şart altında bozulmaması gereken kod!
  if (!req.path.startsWith('/yonetim/')) {
    return next();
  }

  // Ana /yonetim endpoint'i için auth kontrolü yapma
  if (req.path === '/yonetim' || req.path === '/yonetim/') {
    return next();
  }

  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Session yenileme ve süre uzatma
  req.session.cookie.maxAge = 8 * 60 * 60 * 1000; // 8 saat
  req.session.touch();

  // IP kontrolü
  const clientIP = req.ip || req.connection.remoteAddress;
  if (req.session.lastIP && req.session.lastIP !== clientIP) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    return res.status(401).json({ message: "Session invalidated" });
  }

  req.session.lastIP = clientIP;
  next();
}

export function extendSession(req: Request, _res: Response, next: NextFunction) {
  if (req.session) {
    req.session.touch();
  }
  next();
}