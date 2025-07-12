// app/api/auth/auth-options.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { users } from "@shared/schemas";
import { eq, or } from "drizzle-orm";
import "next-auth/jwt";
import { db } from "@shared/db";
import { comparePasswords } from "@/utils/compare-passwords";
import bcrypt from 'bcryptjs';
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import crypto from 'crypto';

// Extend the User type
declare module "next-auth" {
  interface User {
    id: string;
    email?: string;
    name?: string;
    emailVerified?: boolean | null;
    isAdmin?: boolean;
    type?: "user" | "admin";
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      email?: string;
      name?: string;
      emailVerified?: boolean | null;
      isAdmin?: boolean;
      type?: "user" | "admin";
      username?: string;
    };
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    name?: string;
    emailVerified?: boolean | null;
    isAdmin?: boolean;
    type?: "user" | "admin";
    username?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "user-credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Kullanıcı Adı", type: "text" },
        password: { label: "Şifre", type: "password" },
        ip_address: { label: "IP Adresi", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Kullanıcı adı ve şifre gereklidir");
        }
        
        // reCAPTCHA sunucu doğrulaması
        console.log('Authorize fonksiyonu çağrıldı, credentials:', {
          username: credentials.username,
          recaptchaToken: credentials.hasOwnProperty('recaptchaToken') ? 'var' : 'yok',
          ip_address: credentials.ip_address
        });
        
        const recaptchaToken = (credentials as any).recaptchaToken;
        console.log('reCAPTCHA token:', recaptchaToken ? 'Alındı' : 'Alınamadı');
        
        if (!recaptchaToken) {
          console.log('reCAPTCHA token bulunamadı, hata fırlatılıyor');
          throw new Error("reCAPTCHA doğrulaması başarısız oldu. Lütfen tekrar deneyin.");
        }
        
        try {
          // reCAPTCHA doğrulama
          console.log('reCAPTCHA doğrulama isteği gönderiliyor...');
          console.log('Kullanılan site key (env):', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? 'Tanımlı' : 'Tanımlı değil');
          console.log('Kullanılan secret key (env):', process.env.RECAPTCHA_SECRET_KEY ? 'Tanımlı' : 'Tanımlı değil');
          
          // Secret key'i direkt olarak belirtelim
          const secretKey = '6LdesFArAAAAAOyHVPW8HOF7iQGyq8_b8lihjxR6';
          console.log('Kullanılan secret key (sabit):', secretKey.substring(0, 5) + '...');
          
          const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${recaptchaToken}`,
          });
          
          const verifyData = await verifyRes.json();
          console.log('reCAPTCHA doğrulama sonucu:', verifyData);
          
          if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
            console.log('reCAPTCHA doğrulama başarısız oldu');
            throw new Error("reCAPTCHA doğrulaması başarısız oldu. Lütfen tekrar deneyin.");
          }
          
          console.log('reCAPTCHA doğrulama başarılı')
          
          // Kullanıcı bilgileri kontrolü
          if (!credentials.username || !credentials.password) {
            throw new Error("Kullanıcı adı ve şifre gereklidir");
          }
          
          // Kullanıcı adı ile giriş dene, yoksa e-posta ile
          const [user] = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.username, String(credentials.username)),
                eq(users.email, String(credentials.username))
              )
            )
            
          if (!user) {
            throw new Error("Kullanıcı adı veya şifre hatalı");
          }
          
          // Şifre kontrolü
          const passwordMatches = await comparePasswords(
            String(credentials.password),
            user.password
          );
          
          if (!passwordMatches) {
            throw new Error("Kullanıcı adı veya şifre hatalı");
          }
          
          if (user.status === false) {
            throw new Error(
              "Hesabınız devre dışı bırakılmıştır. Lütfen destek ekibi ile iletişime geçin."
            );
          }
          
          if (user.emailVerified === false) {
            throw new Error(
              "E-posta adresinizi henüz doğrulamadınız. Lütfen e-postanıza gönderilen doğrulama bağlantısını kullanın."
            );
          }
          
          // Son giriş bilgilerini güncelle
          await db
            .update(users)
            .set({
              lastSeen: new Date(),
              ip_address: credentials.ip_address
                ? String(credentials.ip_address)
                : null,
            })
            .where(eq(users.id, user.id));
            
          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            emailVerified: user.emailVerified,
            isAdmin: user.isAdmin || false,
            type: user.isAdmin ? "admin" : "user",
            username: user.username,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Giriş sırasında bir hata oluştu");
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    // CredentialsProvider({
    //   id: "admin-credentials",
    //   name: "Admin Credentials",
    //   credentials: {
    //     username: { label: "Username", type: "text" },
    //     password: { label: "Password", type: "password" },
    //   },
    //   async authorize(credentials) {
    //     if (!credentials?.username || !credentials?.password) {
    //       return null;
    //     }
    //     try {
    //       const [adminUser] = await db
    //         .select()
    //         .from(admin_users)
    //         .where(eq(admin_users.username, credentials.username));

    //       if (adminUser && bcrypt.compareSync(credentials.password, adminUser.password)) {
    //         return {
    //           id: adminUser.id.toString(),
    //           name: adminUser.username, // veya adminUser.name varsa
    //           type: 'admin',
    //           isAdmin: true,
    //           username: adminUser.username, // NextAuth User tipine uygun olmalı
    //         } as any; 
    //       }
    //       return null;
    //     } catch (error) {
    //       console.error("Admin authorize error:", error);
    //       return null;
    //     }
    //   },
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // DÜZELTME: Google ile sosyal login'de, kendi kullanıcı id'n (users.id, integer) session ve token'a yazılır. Google'dan gelen id sadece googleId alanında tutulur. Google ile giriş yapmayanların googleId'si null olur.
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const email = user.email;
        const providerId = account.providerAccountId;
        const name = user.name || profile?.name || (account.provider === 'google' ? 'Google Kullanıcısı' : 'Facebook Kullanıcısı');
        let username = name;
        if (!username) {
          username = (email && typeof email === 'string') ? email.split('@')[0] : (account.provider === 'google' ? 'googleuser' : 'facebookuser');
        }
        const image = (user.image || (profile && (profile as any).picture)) || null;
        // Kullanıcıyı e-posta ile bul
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, String(email)));
        if (existingUser) {
          // Eğer ilgili provider id yoksa ekle/güncelle
          const updateData: any = {
            profileImage: image,
            username: String(username),
            emailVerified: true,
          };
          if (account.provider === 'google' && !existingUser.googleId) {
            updateData.googleId = String(providerId);
          }
          if (account.provider === 'facebook' && !existingUser.facebookId) {
            updateData.facebookId = String(providerId);
          }
          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, existingUser.id));
          // user.id olarak kendi veritabanı id'sini döndür
          user.id = existingUser.id.toString();
          return true;
        } else {
          // Yoksa yeni kullanıcı oluştur
          const insertData: any = {
            email: String(email),
            profileImage: image,
            username: String(username),
            emailVerified: true,
            status: true,
            password: crypto.randomUUID(),
          };
          if (account.provider === 'google') {
            insertData.googleId = String(providerId);
            insertData.facebookId = null;
          }
          if (account.provider === 'facebook') {
            insertData.facebookId = String(providerId);
            insertData.googleId = null;
          }
          const inserted = await db
            .insert(users)
            .values(insertData)
            .returning({ id: users.id });
          // user.id olarak yeni oluşturulan id'yi döndür
          user.id = inserted[0].id.toString();
          return true;
        }
      }
      // Diğer providerlar veya normal giriş için default davranış
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // user.id burada kendi veritabanı id'n olmalı (integer)
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.emailVerified = user.emailVerified ? true : null;
        token.isAdmin = Boolean(user.isAdmin);
        token.type = user.type || "user";
        token.username = user.username || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id; // integer id
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.emailVerified = token.emailVerified;
        session.user.isAdmin = token.isAdmin;
        session.user.type = token.type;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
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