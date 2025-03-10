import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { users, admin_users } from '@shared/schemas';
import { eq } from "drizzle-orm";
import 'next-auth/jwt'
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "@shared/db";

const scryptAsync = promisify(scrypt);

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

export async function hashPassword(password: string) {
  const salt = randomBytes(32).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Kullanıcı tipini genişlet
declare module "next-auth" {
  interface User {
    id: string;
    email?: string;
    name?: string;
    emailVerified?: boolean | null;
    isAdmin?: boolean;
    type?: 'user' | 'admin';
    username?: string;
  }
  
  interface Session {
    user: {
      id: string;
      email?: string;
      name?: string;
      emailVerified?: boolean | null;
      isAdmin?: boolean;
      type?: 'user' | 'admin';
      username?: string;
    }
  }
}

// JWT tipini genişlet
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    name?: string;
    emailVerified?: boolean | null;
    isAdmin?: boolean;
    type?: 'user' | 'admin';
    username?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "user-credentials",
      name: "User Credentials",
      credentials: {
        username: { label: "Kullanıcı Adı", type: "text" },
        password: { label: "Şifre", type: "password" },
        ip_address: { label: "IP Adresi", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Kullanıcıyı veritabanından bul
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, String(credentials.username)));

          // Kullanıcı yoksa
          if (!user) {
            return null;
          }

          // Şifre karşılaştırma
          const passwordMatches = await comparePasswords(String(credentials.password), user.password);
          if (!passwordMatches) {
            return null;
          }

          // Kullanıcı aktif değilse
          if (user.status === false) {
            throw new Error('Hesabınız devre dışı bırakılmıştır. Lütfen yönetici ile iletişime geçin.');
          }

          // Son giriş bilgilerini güncelle
          await db
            .update(users)
            .set({
              lastSeen: new Date(),
              ip_address: credentials.ip_address ? String(credentials.ip_address) : null
            })
            .where(eq(users.id, user.id));

          // Kullanıcı bilgilerini döndür
          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            emailVerified: user.emailVerified,
            isAdmin: user.isAdmin,
            type: 'user',
            username: user.username
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        username: { label: "Kullanıcı Adı", type: "text" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Admin kullanıcısını bul
          const [admin] = await db
            .select()
            .from(admin_users)
            .where(eq(admin_users.username, String(credentials.username)));

          // Admin yoksa
          if (!admin) {
            return null;
          }

          // Şifre karşılaştırma
          const passwordMatches = await comparePasswords(String(credentials.password), admin.password);
          if (!passwordMatches) {
            return null;
          }

          // Admin bilgilerini döndür
          return {
            id: String(admin.id),
            name: admin.username,
            email: "",
            emailVerified: true,
            isAdmin: true,
            type: 'admin',
            username: admin.username
          };
        } catch (error) {
          console.error("Admin auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.name = user.name || "";
        token.emailVerified = user.emailVerified || null;
        token.isAdmin = Boolean(user.isAdmin);
        token.type = user.type || "user";
        token.username = user.username || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.emailVerified = token.emailVerified;
        session.user.isAdmin = token.isAdmin;
        session.user.type = token.type;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 