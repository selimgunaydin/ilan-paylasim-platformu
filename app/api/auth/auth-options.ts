// app/api/auth/auth-options.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { users } from "@shared/schemas";
import { eq } from "drizzle-orm";
import "next-auth/jwt";
import { db } from "@shared/db";
import { comparePasswords } from "@/utils/compare-passwords";
import bcrypt from 'bcryptjs';

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
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Kullanıcı adı ve şifre gereklidir");
        }
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, String(credentials.username)));

          if (!user) {
            throw new Error("Kullanıcı adı veya şifre hatalı");
          }

          const passwordMatches = await comparePasswords(
            String(credentials.password),
            user.password
          );
          if (!passwordMatches) {
            throw new Error("Kullanıcı adı veya şifre hatalı");
          }

          if (user.status === false) {
            throw new Error(
              "Hesabınız devre dışı bırakılmıştır. Lütfen yönetici ile iletişime geçin."
            );
          }

          // emailVerified kontrolü
          if (user.emailVerified === false) {
            throw new Error(
              "E-posta adresinizi henüz doğrulamadınız. Lütfen e-postanıza gönderilen doğrulama bağlantısını kullanın."
            );
          }

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.name = user.name || "";
        token.emailVerified = user.emailVerified ? true : null;
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