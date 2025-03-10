import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db'
import { conversations, listings, messages, users } from '@shared/schemas'
import { eq, desc, sql } from 'drizzle-orm'
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
    const userId = Number(token.sub);

    // Kullanıcının gönderdiği mesajları içeren konuşmaları getir
    const sentConversations = await db
      .select({
        id: conversations.id,
        listingId: conversations.listingId,
        senderId: conversations.senderId,
        receiverId: conversations.receiverId,
        createdAt: conversations.createdAt,
        listingTitle: listings.title,
        receiver: {
          id: users.id,
          username: users.username,
          profileImage: users.profileImage,
          gender: users.gender,
          avatar: users.avatar,
          lastSeen: users.lastSeen,
        },
        unreadCount: sql<number>`
          (SELECT COUNT(*)::int 
           FROM ${messages} 
           WHERE ${messages.conversationId} = ${conversations.id} 
           AND ${messages.isRead} = false 
           AND ${messages.receiverId} = ${userId})
        `.as('unreadCount'),
      })
      .from(conversations)
      .innerJoin(
        listings,
        eq(conversations.listingId, listings.id)
      )
      .innerJoin(
        users,
        eq(conversations.receiverId, users.id)
      )
      .leftJoin(
        messages,
        eq(conversations.id, messages.conversationId)
      )
      .where(eq(conversations.senderId, userId))
      .groupBy(
        conversations.id,
        listings.title,
        users.id,
        users.username,
        users.profileImage,
        users.gender,
        users.avatar,
        users.lastSeen
      )
      .orderBy(desc(conversations.createdAt))

    return NextResponse.json(sentConversations)
  } catch (error) {
    console.error("Error fetching sent conversations:", error)
    return NextResponse.json({ error: "Gönderilen konuşmalar yüklenemedi" }, { status: 500 })
  }
}