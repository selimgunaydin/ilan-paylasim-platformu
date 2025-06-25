import { NextResponse } from 'next/server';
import { db } from '@shared/db';
import { users, listings, messages, favorites, conversations, site_settings } from '@shared/schemas';
import { subMonths, subWeeks } from 'date-fns';
import { sendEmail } from '@shared/services/email';
import { generateInactivityWarningEmail } from '@shared/services/email-templates';
import { lte, inArray, eq, and, gte, or } from 'drizzle-orm';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const settings = await db.query.site_settings.findFirst();

    if (!settings) {
      console.error("CRON:CLEANUP: Site settings not found. Cleanup job cannot run.");
      return NextResponse.json(
        { ok: false, error: "Site settings not configured." },
        { status: 500 }
      );
    }

    const cleanupMonths = settings.user_cleanup_months;
    // Uyarı, silme işleminden 1 ay önce gönderilir.
    const warningMonths = cleanupMonths - 1;

    const now = new Date();
    const deletionDate = subMonths(now, cleanupMonths);
    const warningDate = subMonths(now, warningMonths);
    const warningWindowStartDate = subWeeks(warningDate, 1);

    // 1. Adım: Uyarı e-postası gönderilecek kullanıcıları bul
    const usersToWarn = await db.query.users.findMany({
      where: and(
        lte(users.lastSeen, warningDate),
        gte(users.lastSeen, warningWindowStartDate)
      ),
    });

    let warningsSent = 0;
    for (const user of usersToWarn) {
      try {
        const emailParams = generateInactivityWarningEmail(user.username);
        emailParams.to = user.email;
        await sendEmail(emailParams);
        warningsSent++;
      } catch (emailError) {
        console.error(`E-posta gönderilemedi: ${user.email}`, emailError);
      }
    }

    // 2. Adım: Verileri silinecek kullanıcıları bul
    const usersToDeleteData = await db.query.users.findMany({
      where: lte(users.lastSeen, deletionDate),
    });

    let deletedDataCounts = {
      favorites: 0,
      messages: 0,
      conversations: 0,
      listings: 0,
    };

    if (usersToDeleteData.length > 0) {
      const userIdsToDelete = usersToDeleteData.map(u => u.id);

      // 3. Adım: Kapsamlı veri temizliği
      const deletedFavorites = await db.delete(favorites).where(inArray(favorites.userId, userIdsToDelete)).returning({ id: favorites.id });
      const deletedMessages = await db.delete(messages).where(or(inArray(messages.senderId, userIdsToDelete), inArray(messages.receiverId, userIdsToDelete))).returning({ id: messages.id });
      const deletedConversations = await db.delete(conversations).where(or(inArray(conversations.senderId, userIdsToDelete), inArray(conversations.receiverId, userIdsToDelete))).returning({ id: conversations.id });
      const deletedListings = await db.delete(listings).where(inArray(listings.userId, userIdsToDelete)).returning({ id: listings.id });

      deletedDataCounts = {
        favorites: deletedFavorites.length,
        messages: deletedMessages.length,
        conversations: deletedConversations.length,
        listings: deletedListings.length,
      };

      console.log(`${userIdsToDelete.length} kullanıcının verileri temizlendi.`);
    }

    return NextResponse.json({
      success: true,
      message: 'İnaktif kullanıcı kontrolü tamamlandı.',
      warningsSent: warningsSent,
      cleanedUserCount: usersToDeleteData.length,
      deletedData: deletedDataCounts
    });

  } catch (error) {
    console.error('Cron job hatası:', error);
    return NextResponse.json({ success: false, message: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
