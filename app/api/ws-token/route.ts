import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getToken } from 'next-auth/jwt';
export async function GET(request: NextRequest) {
  try {
    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

 
    // userId'yi al
    const userId = Number(token.sub);;
    const username = token.username

    // WebSocket için yeni bir token oluştur
    // Bu token kısa ömürlü olmalı (örneğin 1 saat)
    const wsToken = jwt.sign(
      { userId, username, type: 'ws-token' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token: wsToken });
  } catch (error) {
    console.error("Error generating WebSocket token:", error);
    return NextResponse.json(
      { error: "WebSocket token oluşturulamadı" },
      { status: 500 }
    );
  }
} 