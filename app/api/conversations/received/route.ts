import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { conversations, listings, users } from '@/schemas/schema'
import { eq, desc } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
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

    // Kullanıcının aldığı mesajları içeren konuşmaları getir
    const receivedConversations = await db
      .select({
        id: conversations.id,
        listingId: conversations.listingId,
        senderId: conversations.senderId,
        receiverId: conversations.receiverId,
        createdAt: conversations.createdAt,
        listingTitle: listings.title,
        sender: {
          id: users.id,
          username: users.username,
          profileImage: users.profileImage,
          gender: users.gender,
          avatar: users.avatar,
          lastSeen: users.lastSeen,
        },
      })
      .from(conversations)
      .innerJoin(
        listings,
        eq(conversations.listingId, listings.id)
      )
      .innerJoin(
        users,
        eq(conversations.senderId, users.id)
      )
      .where(eq(conversations.receiverId, userId))
      .orderBy(desc(conversations.createdAt))

    return NextResponse.json(receivedConversations)
  } catch (error) {
    console.error("Error fetching received conversations:", error)
    return NextResponse.json({ error: "Alınan konuşmalar yüklenemedi" }, { status: 500 })
  }
} 