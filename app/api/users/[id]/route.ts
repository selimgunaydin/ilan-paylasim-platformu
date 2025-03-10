import { NextResponse } from 'next/server';
import { db } from '@shared/db';
import { getServerSession } from 'next-auth';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return new NextResponse('Invalid user ID', { status: 400 });
    }

    const user = await db.select({
      id: users.id,
      username: users.username,
      profileImage: users.profileImage,
      gender: users.gender,
      avatar: users.avatar,
      createdAt: users.createdAt,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(eq(users.id, userId))
    .execute();

    if (!user || user.length === 0) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 