import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Admin yetkilendirme kontrolü fonksiyonu
export async function checkAdminAuth(request: NextRequest) {
  try {
    // Önce getToken ile JWT token'ı kontrol et
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (token && token.type === 'admin' && token.isAdmin) {
      return { 
        userId: token.id, 
        email: token.email as string,
        username: token.username as string
      };
    }
    
    // Alternatif olarak session kontrolü yap
    const session = await getServerSession({ req: request, ...authOptions });

    if (!session || !session.user || !session.user.isAdmin || session.user.type !== 'admin') {
      return null;
    }

    return { 
      userId: session.user.id, 
      email: session.user.email as string,
      username: session.user.username as string
    };
  } catch (error) {
    console.error("Admin auth check error:", error);
    return null;
  }
}