import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { validatePassword } from "./password-validation";
import { generateVerificationEmail, sendEmail } from "./services/email";
import { generateVerificationToken } from "./utils/token";
import { generatePasswordResetEmail } from "./services/email";
import { sanitizeInput } from "./utils/sanitize";
import { eq } from 'drizzle-orm'; // Import for database query
import { db, schema } from './db'; // Import database connection and schema

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(32).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashedPart, salt] = stored.split(".");
    if (!hashedPart || !salt) {
      console.error("Invalid stored password format");
      return false;
    }

    // Determine hash length and use appropriate scrypt length
    const hashLength = hashedPart.length;
    const keyLength = hashLength === 64 ? 32 : 64; // 64 chars = 32 bytes, 128 chars = 64 bytes

    console.log("Hash comparison:", {
      hashLength,
      keyLength,
      storedHashLength: hashedPart.length,
    });

    const hashedBuf = Buffer.from(hashedPart, "hex");
    const suppliedBuf = (await scryptAsync(
      supplied,
      salt,
      keyLength,
    )) as Buffer;

    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

// Yasaklı kullanıcı adları listesi
const FORBIDDEN_USERNAMES = [
  "admin",
  "administrator",
  "root",
  "system",
  "moderator",
  "mod",
  "support",
  "help",
  "info",
  "contact",
  "webmaster",
  "owner",
  "security",
  "staff",
  "team",
  "official",
  "yonetici",
  "yönetici",
];

// Hiç bir şart altında bozulmaması gereken kod!
export function setupAuth(app: Express) {
  const sessionConfig: session.SessionOptions = {
    // Hiç bir şart altında bozulmaması gereken kod!
    secret: process.env.REPLIT_ID || "super-secret-key",
    resave: false,
    rolling: true,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: "sessionId",
    cookie: {
      maxAge: 4 * 60 * 60 * 1000, // 4 saat
      secure: app.get("env") === "production",
      httpOnly: true,
      path: "/",
      sameSite: "strict",
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    "local",
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        let user;
        const isEmail = username.includes("@");

        if (isEmail) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }

        if (!user) {
          return done(null, false, {
            message: "Hatalı kullanıcı adı/email veya şifre",
          });
        }

        if (user.status === false) {
          return done(null, false, {
            message:
              "Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.",
          });
        }

        if (!user.emailVerified) {
          return done(null, false, {
            message: "Lütfen email adresinizi doğrulayın",
          });
        }

        const isValid = await comparePasswords(password, user.password);

        if (!isValid) {
          return done(null, false, {
            message: "Hatalı kullanıcı adı/email veya şifre",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.use(
    "admin",
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        const admin = await storage.getAdminByUsername(username);

        if (!admin) {
          return done(null, false, {
            message: "Geçersiz kullanıcı adı veya şifre",
          });
        }

        const isValid = await comparePasswords(password, admin.password);

        if (!isValid) {
          return done(null, false, {
            message: "Geçersiz kullanıcı adı veya şifre",
          });
        }

        const adminWithType = { ...admin, type: "admin" as const };
        return done(null, adminWithType);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: any, done) => {
    if (user.type === "admin") {
      done(null, { id: user.id, type: "admin" });
    } else {
      done(null, { id: user.id, type: "user" });
    }
  });

  passport.deserializeUser(async (data: { id: number; type: string }, done) => {
    try {
      if (data.type === "admin") {
        const admin = await storage.getAdmin(data.id);
        if (!admin) {
          return done(null, false);
        }
        const adminWithType = { ...admin, type: "admin" as const };
        return done(null, adminWithType);
      } else {
        const user = await storage.getUser(data.id);
        if (!user?.emailVerified) {
          return done(null, false);
        }
        done(null, user);
      }
    } catch (err) {
      done(err);
    }
  });

  // Register endpoint güncellemesi
  app.post("/api/register", async (req, res) => {
    try {
      console.log("Raw registration data:", {
        username: req.body.username,
        email: req.body.email,
        gender: req.body.gender,
        hasPassword: !!req.body.password,
        ip_address: req.body.ip_address
      });

      const username = sanitizeInput(req.body.username);
      const password = sanitizeInput(req.body.password);
      const email = sanitizeEmail(req.body.email);
      const gender = sanitizeInput(req.body.gender || "unspecified");
      const ip_address = req.body.ip_address || req.ip || null;

      console.log("Sanitized registration data:", {
        username,
        email,
        gender,
        hasPassword: !!password,
        ip_address
      });


      if (!username) {
        console.log("Validation failed: Missing username");
        return res.status(400).json({
          field: "username",
          message: "Kullanıcı adı zorunludur",
        });
      }


      if (FORBIDDEN_USERNAMES.includes(username.toLowerCase())) {
        console.log("Validation failed: Forbidden username:", username);
        return res.status(400).json({
          field: "username",
          message: "Bu kullanıcı adı kullanılamaz",
        });
      }

      if (!password) {
        console.log("Validation failed: Missing password");
        return res.status(400).json({
          field: "password",
          message: "Şifre zorunludur",
        });
      }

      if (!email) {
        console.log("Validation failed: Missing email");
        return res.status(400).json({
          field: "email",
          message: "Email adresi zorunludur",
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.log("Validation failed: Invalid email format");
        return res.status(400).json({
          field: "email",
          message: "Geçerli bir email adresi giriniz",
        });
      }

      console.log("Checking for existing username:", username);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Registration failed: Username already exists:", username);
        return res.status(400).json({
          field: "username",
          message: "Bu kullanıcı adı zaten kullanılıyor",
        });
      }

      console.log("Checking for existing email:", email);
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        console.log("Registration failed: Email already exists:", email);
        return res.status(400).json({
          field: "email",
          message: "Bu email adresi zaten kullanılıyor",
        });
      }

      console.log("Generating verification token for:", email);
      const verificationToken = generateVerificationToken();
      const hashedPassword = await hashPassword(password);

      console.log("Creating user in database:", { username, email, gender, ip_address });
      const result = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        verificationToken,
        emailVerified: false,
        status: true,
        gender,
        ip_address
      });

      if (!result) {
        console.error("Failed to create user in database");
        throw new Error("Kullanıcı oluşturulamadı");
      }

      // Send verification email
      console.log("Preparing verification email for:", email);
      const emailParams = generateVerificationEmail(email, verificationToken);
      console.log("Sending verification email with params:", {
        to: emailParams.to,
        subject: emailParams.subject,
        hasText: !!emailParams.text,
        hasHtml: !!emailParams.html,
      });

      const emailSent = await sendEmail(emailParams);

      if (!emailSent) {
        console.error("Failed to send verification email to:", email);
      } else {
        console.log("Verification email sent successfully to:", email);
      }

      res.status(201).json({
        ...result,
        message: "Hesabınız oluşturuldu. Lütfen email adresinizi doğrulayın.",
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  // Login endpoint güncellemesi
  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt with:", {
      username: req.body.username,
      hasPassword: !!req.body.password,
      ip_address: req.body.ip_address
    });

    passport.authenticate(
      "local",
      async (err: Error, user: SelectUser, info: { message: string }) => {
        if (err) {
          console.error("Login error:", err);
          return res
            .status(500)
            .json({ message: "An internal error occurred" });
        }

        if (!user) {
          console.log("Login failed:", info?.message);
          return res
            .status(400)
            .json({ message: info?.message || "Giriş başarısız" });
        }

        req.logIn(user, async (err) => {
          if (err) {
            console.error("Login session error:", err);
            return res.status(500).json({ message: "Oturum oluşturulamadı" });
          }

          try {
            // Update last_seen and ip_address
            const ip_address = req.body.ip_address || req.ip || null;
            console.log("Updating user last seen and IP:", {
              userId: user.id,
              ip_address
            });

            await db
              .update(schema.users)
              .set({ 
                lastSeen: new Date(), 
                ip_address: ip_address 
              })
              .where(eq(schema.users.id, user.id));

            // Session'ı güncelle
            if (req.session) {
              req.session.touch();
              req.session.lastIP = ip_address;

              // Force session save
              req.session.save((err) => {
                if (err) {
                  console.error("Session save error:", err);
                  return res
                    .status(500)
                    .json({ message: "Oturum kaydedilemedi" });
                }
                console.log("User login successful:", { 
                  id: user.id,
                  ip_address: ip_address 
                });
                res.json(user);
              });
            } else {
              res.json(user);
            }
          } catch (error) {
            console.error("Error updating user data:", error);
            // Still return user data even if update fails
            res.json(user);
          }
        });
      },
    )(req, res, next);
  });

  // Admin giriş endpoint'i
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate(
      "admin",
      (err: Error, admin: any, info: { message: string }) => {
        if (err) {
          console.error("Admin authentication error:", err);
          return next(err);
        }

        if (!admin) {
          return res
            .status(400)
            .json({ message: info?.message || "Giriş başarısız" });
        }

        req.logIn(admin, (err) => {
          if (err) {
            console.error("Admin login error:", err);
            return next(err);
          }

          // Oturum bilgilerini güncelle
          if (req.session) {
            req.session.adminId = admin.id;
            req.session.isAdmin = true;
            req.session.lastIP = req.ip;

            // Force session save
            req.session.save((err) => {
              if (err) {
                console.error("Session save error:", err);
                return next(err);
              }
              console.log("Admin login successful:", {
                id: admin.id,
                type: "admin",
              });
              res.json({ ...admin, type: "admin" });
            });
          } else {
            res.json({ ...admin, type: "admin" });
          }
        });
      },
    )(req, res, next);
  });

  // Normal kullanıcı girişi

  app.post("/api/logout", (req, res, next) => {
    // Admin oturumunu temizle
    if (req.session) {
      delete req.session.adminId;
      delete req.session.isAdmin;
      delete req.session.lastIP;
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user)
      return res.status(500).json({ message: "Kullanıcı bilgileri alınamadı" });
    res.json(req.user);
  });

  app.get("/api/admin/user", (req, res) => {
    console.log("Admin user check:", {
      sessionExists: !!req.session,
      adminId: req.session?.adminId,
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
    });

    if (!req.session?.adminId || !req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    if (!req.user || (req.user as any).type !== "admin") {
      return res.sendStatus(401);
    }

    res.json(req.user);
  });
}

// Yardımcı fonksiyonlar aynı kalacak
function sanitizeEmail(email: string | undefined): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}