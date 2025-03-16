import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../../../../../../services/email';
import { generateUserBannedEmail, generateUserReactivatedEmail } from '../../../../../../services/email-templates';

export const dynamic = 'force-dynamic';

// Kullanıcı durumunu güncelleme API'si (ban/unban)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 400 }
      );
    }

    // Request body'den durum bilgisini al
    const body = await request.json();
    const { status } = body;

    if (status === undefined) {
      return NextResponse.json(
        { error: "Durum bilgisi gereklidir" },
        { status: 400 }
      );
    }

    // Boolean kontrolü
    const statusValue = typeof status === 'boolean' ? status : 
                       (status === 'true' || status === '1' || status === 'yes');

    // Kullanıcıyı güncelle
    const [updatedUser] = await db
      .update(users)
      .set({ status: statusValue })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcı banlandıysa e-posta gönder
    if (status === false || status === 'false' || status === '0' || status === 'no') {
      if (updatedUser.email) {
        const emailTemplate = generateUserBannedEmail(updatedUser.username);
        
        emailTemplate.to = updatedUser.email;
        
        try {
          await sendEmail(emailTemplate);
          console.log(`Ban notification email sent to ${updatedUser.email}`);
        } catch (emailError) {
          console.error("Error sending ban notification email:", emailError);
          // Email gönderimi başarısız olsa bile API yanıtını etkilemez
        }
      }
    }
    // Kullanıcı aktifleştirildiyse e-posta gönder
    else if (status === true || status === 'true' || status === '1' || status === 'yes') {
      if (updatedUser.email) {
        const emailTemplate = generateUserReactivatedEmail(updatedUser.username);
        
        emailTemplate.to = updatedUser.email;
        
        try {
          await sendEmail(emailTemplate);
          console.log(`Reactivation notification email sent to ${updatedUser.email}`);
        } catch (emailError) {
          console.error("Error sending reactivation notification email:", emailError);
          // Email gönderimi başarısız olsa bile API yanıtını etkilemez
        }
      }
    }

    // Hassas bilgileri çıkar
    const { password, verificationToken, resetPasswordToken, ...safeUser } = updatedUser;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Kullanıcı durumu güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Kullanıcı durumu güncellenemedi" },
      { status: 500 }
    );
  }
} 