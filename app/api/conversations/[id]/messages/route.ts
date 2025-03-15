import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { conversations, messages } from '@shared/schemas';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate conversation ID
    const conversationId = parseInt(params.id);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (isNaN(page) || isNaN(limit) || page < 0 || limit <= 0) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    // Get auth token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = Number(token.sub);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 401 });
    }

    // Fetch conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check permissions
    if (conversation.senderId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json({ error: "No access to this conversation" }, { status: 403 });
    }

    // Get total message count
    const totalResult = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    const total = totalResult[0]?.count || 0;
    const hasMore = (page + 1) * limit < total;

    // Fetch paginated messages
    const messagesList = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
      limit: limit,
      offset: page * limit,
    });

    // Mark messages as read (if receiver)
    if (conversation.receiverId === userId) {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        ));
    }

    return NextResponse.json({
      messages: messagesList,
      hasMore,
      page,
      total,
      listingId: conversation.listingId
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching messages:", error);

    // Specific error handling
    if (error instanceof Error) {
      if (error.message.includes('database')) {
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}