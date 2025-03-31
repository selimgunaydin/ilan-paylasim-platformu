import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@shared/db'
import { conversations, listings, messages, users } from '@shared/schemas'
import { eq, desc, sql } from 'drizzle-orm'
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

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

    // Kullanıcının aldığı mesajları içeren konuşmaları getir
    const receivedConversations = await db
      .select({
        id: conversations.id,
        listingId: conversations.listingId,
        senderId: conversations.senderId,
        receiverId: conversations.receiverId,
        createdAt: conversations.createdAt,
        listingTitle: listings.title,
        contactPerson: listings.contactPerson,
        sender: {
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
        eq(conversations.senderId, users.id)
      )
      .leftJoin(
        messages,
        eq(conversations.id, messages.conversationId)
      )
      .where(eq(conversations.receiverId, userId))
      .groupBy(
        conversations.id,
        listings.title,
        listings.contactPerson,
        users.id,
        users.username,
        users.profileImage,
        users.gender,
        users.avatar,
        users.lastSeen
      )
      .orderBy(desc(conversations.createdAt))

    return NextResponse.json(receivedConversations)
  } catch (error) {
    console.error("Error fetching received conversations:", error)
    return NextResponse.json({ error: "Alınan konuşmalar yüklenemedi" }, { status: 500 })
  }
}