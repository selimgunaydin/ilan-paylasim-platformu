import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from '@shared/services/email';
import { generateResendVerificationEmail } from '@shared/services/email-templates';

export const dynamic = 'force-dynamic';

// E-posta gönderme sıklığını takip etmek için basit bir in-memory store
const emailTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 dakika

export async function POST(request: NextRequest) {
  console.log('[API /resend-verification-email] Received request. Method:', request.method, 'URL:', request.url);
  console.log('[API /resend-verification-email] Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
  try {
    const body = await request.json();
    console.log('[API /resend-verification-email] Request body:', body);
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'E-posta adresi veya kullanıcı adı gereklidir' },
        { status: 400 }
      );
    }

    // Rate Limiting Kontrolü
    const lastSentTime = emailTimestamps.get(email);
    if (lastSentTime && Date.now() - lastSentTime < RATE_LIMIT_MS) {
      return NextResponse.json(
        { success: false, message: 'Kısa süre içinde tekrar e-posta gönderemezsiniz. Lütfen 1 dakika bekleyin.' },
        { status: 429 } // Too Many Requests
      );
    }
    

    console.log(`[Resend API] Kullanıcı aranıyor: ${email}`);
    
    // Önce e-posta olarak ara
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    // Bulunamadıysa kullanıcı adı olarak ara
    if (!user) {
      console.log(`[Resend API] E-posta olarak bulunamadı, kullanıcı adı olarak deneniyor: ${email}`);
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, email));
    }
    
    console.log(`[Resend API] Kullanıcı bulundu mu: ${!!user}`);
    if (user) {
      console.log(`[Resend API] Kullanıcı durumu:`, {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        hasToken: !!user.verificationToken
      });
    }

    // Kullanıcı bulunamazsa veya zaten doğrulanmışsa bile başarılı mesajı döndür (Gizlilik)
    if (!user || user.emailVerified) {
      // E-posta gönderildi gibi davran ama rate limit için zaman damgasını güncelleme
      // Bu, mevcut olmayan e-postaların spam olarak kullanılmasını zorlaştırır.
      console.log(`Resend verification attempt for non-existent or verified email: ${email}`);
      return NextResponse.json(
        { success: true, message: 'Doğrulama e-postası gönderildi (veya zaten doğrulandı).' },
        { status: 200 }
      );
    }

    // Yeni doğrulama token'ı oluştur
    const newVerificationToken = crypto.randomBytes(20).toString('hex');
    console.log(`[Resend API] Yeni token oluşturuldu: ${newVerificationToken.substring(0, 5)}...`);

    // Kullanıcının doğrulama token'ını güncelle
    console.log(`[Resend API] Token güncelleniyor... Kullanıcı ID: ${user.id}`);
    const updateResult = await db
      .update(users)
      .set({
        verificationToken: newVerificationToken,
        // İsteğe bağlı: emailVerified durumunu false yapabilirsiniz, eğer bir şekilde true olduysa ama token yoksa
        // emailVerified: false, 
      })
      .where(eq(users.id, user.id))
      .returning();
    
    console.log(`[Resend API] Token güncelleme sonucu:`, updateResult);

    // Doğrulama e-postasını gönder
    console.log(`[Resend API] E-posta parametreleri oluşturuluyor... (Yeniden gönderim)`);
    const emailParams = generateResendVerificationEmail(user.email, newVerificationToken);
    console.log(`[Resend API] E-posta parametreleri:`, {
      to: emailParams.to,
      subject: emailParams.subject,
      hasText: !!emailParams.text,
      hasHtml: !!emailParams.html
    });
    
    console.log(`[Resend API] sendEmail fonksiyonu çağrılıyor...`);
    try {
      await sendEmail(emailParams);
      console.log(`[Resend API] E-posta başarıyla gönderildi!`);
    } catch (error) {
      console.error(`[Resend API] E-posta gönderme hatası:`, error);
      throw error; // Hatayı tekrar fırlat, üst catch bloğu tarafından yakalanacak
    }

    // Başarılı gönderim sonrası zaman damgasını güncelle
    emailTimestamps.set(email, Date.now());

    return NextResponse.json(
      { success: true, message: 'Doğrulama e-postası başarıyla yeniden gönderildi.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('\n\n[API /resend-verification-email] CATCH BLOCK HATASI - BAŞLANGIÇ');
    console.error('[API /resend-verification-email] CATCH block. Error:', error);
    
    if (error instanceof Error) {
      console.error('[API /resend-verification-email] Error name:', error.name);
      console.error('[API /resend-verification-email] Error message:', error.message);
      console.error('[API /resend-verification-email] Error stack:', error.stack);
      
      // SendGrid hatalarını daha detaylı incele
      if (error.message.includes('authorization')) {
        console.error('[API /resend-verification-email] SendGrid API key sorunu olabilir!');
      } else if (error.message.includes('sender')) {
        console.error('[API /resend-verification-email] Gönderici e-posta adresi sorunu olabilir!');
      } else if (error.message.includes('recipient')) {
        console.error('[API /resend-verification-email] Alıcı e-posta adresi sorunu olabilir!');
      }
    } else {
      console.error('[API /resend-verification-email] Bilinmeyen hata türü:', typeof error);
    }
    
    console.error('[API /resend-verification-email] CATCH BLOCK HATASI - BİTİŞ\n\n');
    
    return NextResponse.json(
      { success: false, message: 'E-posta gönderimi sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}