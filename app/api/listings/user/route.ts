import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { categories, listings } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

// Kullanıcının kendi ilanlarını getiren API
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

    // Kullanıcının ilanlarını getir
    const userListings = await db
      .select()
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(listings.createdAt);
      const allCategories = await db.select().from(categories);
      const listingWithCategory = userListings.map(listing => { 
        const category = allCategories.find(c => c.id === listing.categoryId);
        return {
          ...listing,
          categoryName: category?.name || null
        };
      });
    return NextResponse.json(listingWithCategory);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json(
      { error: "Kullanıcı ilanları getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 