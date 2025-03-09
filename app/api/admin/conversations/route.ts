import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { conversations, users, listings, messages } from '@/schemas/schema';
import { eq, sql, desc, inArray } from 'drizzle-orm';
import { checkAdminAuth } from '@/utils/check-admin';

// Admin konuşma listesi getirme API'si
export async function GET(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Sayfalama parametrelerini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Alt sorgu ile mesaj sayılarını hesapla
    const messageCountSubquery = db
      .select({
        conversationId: messages.conversationId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(messages)
      .groupBy(messages.conversationId)
      .as("message_counts");

    // Toplam konuşma sayısını al
    console.log("Toplam konuşma sayısı sorgusu başlıyor...");
    const [totalCount] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(conversations);
    console.log("Toplam konuşma sayısı:", totalCount);

    // Konuşmaları getir
    console.log("Konuşmaları getirme sorgusu başlıyor...");
    const conversationsData = await db
      .select({
        id: conversations.id,
        listingId: conversations.listingId,
        senderId: conversations.senderId, 
        receiverId: conversations.receiverId,
        createdAt: conversations.createdAt,
        listingTitle: listings.title,
        messageCount: sql<number>`COALESCE(message_counts.count, 0)::int`,
      })
      .from(conversations)
      .leftJoin(
        listings,
        eq(conversations.listingId, listings.id),
      )
      .leftJoin(
        messageCountSubquery,
        eq(conversations.id, messageCountSubquery.conversationId),
      )
      .orderBy(desc(conversations.createdAt))
      .limit(limit)
      .offset(offset);
    console.log("Konuşmalar başarıyla getirildi:", conversationsData);

    // Tüm ilgili kullanıcıların ID'lerini topla
    const userIds = new Set<number>();
    for (const conv of conversationsData) {
      if (conv.senderId) userIds.add(conv.senderId);
      if (conv.receiverId) userIds.add(conv.receiverId);
    }
    console.log("Toplanan kullanıcı ID'leri:", Array.from(userIds));

    // Kullanıcı bilgilerini tek seferde getir
    type UserType = {
      id: number;
      username: string;
      profileImage: string | null;
      gender: string | null;
      avatar: string | null;
      lastSeen: Date | null;
    };
    
    let userList: UserType[] = [];
    if (userIds.size > 0) {
      console.log("Kullanıcı bilgileri sorgusu başlıyor...");
      const userIdsArray = Array.from(userIds);
      userList = await db
        .select({
          id: users.id,
          username: users.username,
          profileImage: users.profileImage,
          gender: users.gender,
          avatar: users.avatar,
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(inArray(users.id, userIdsArray))
      console.log("Kullanıcı bilgileri başarıyla getirildi:", userList);
    }

    // Kullanıcı bilgilerini Map'e ekle
    const userMap = new Map();
    for (const user of userList) {
      userMap.set(user.id, user);
    }

    // Son response'u oluştur
    const result = {
      data: conversationsData.map((conv) => ({
        ...conv,
        sender: userMap.get(conv.senderId),
        receiver: userMap.get(conv.receiverId),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount.count / limit),
        totalItems: totalCount.count,
        itemsPerPage: limit,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin konuşma listesi getirme hatası:", error);
    let errorMessage = "Konuşmalar yüklenemedi";
    if (error instanceof Error) {
      errorMessage = `Konuşmalar yüklenemedi: ${error.message}`;
      console.error("Hata detayı:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 