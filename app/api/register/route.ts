import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import crypto, { randomBytes, scrypt } from 'crypto';
import { sendEmail } from '@shared/services/email';
import { generateVerificationEmail } from '@shared/services/email-templates';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(32).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
} 

// Kayıt API'si
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, ip_address, terms } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı, email ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Terms kontrolü
    if (!terms) {
      return NextResponse.json(
        { success: false, message: 'Kullanım koşullarını kabul etmelisiniz' },
        { status: 400 }
      );
    }

    // Kullanıcı adı zaten var mı kontrol et
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'Bu kullanıcı adı zaten kullanımda' },
        { status: 400 }
      );
    }

    // Email zaten var mı kontrol et
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingEmail) {
      // Eğer e-posta mevcut ve hesap pasif durumdaysa, özel bir mesaj döndür
      if (existingEmail.status === false) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Bu hesap aktif değildir. Hesabınızı aktif etmek için lütfen destek ekibiyle iletişime geçin.' 
          },
          { status: 409 } // 409 Conflict, kaynağın mevcut durumuyla çakışma olduğunu belirtir
        );
      }
      // Eğer hesap aktifse, standart 'zaten kullanımda' mesajını döndür
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi zaten kullanımda' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await hashPassword(password);

    // Doğrulama token'ı oluştur
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Kullanıcıyı oluştur
    const [createdUser] = await db
      .insert(users)
      .values({
        username,
        email,
        password: hashedPassword,
        verificationToken,
        emailVerified: false,
        createdAt: new Date(),
        isAdmin: false,
        status: true,
        ip_address
      })
      .returning();

      const emailParams = generateVerificationEmail(email, verificationToken);
      console.log("Sending verification email with params:", {
        to: emailParams.to,
        subject: emailParams.subject,
        hasText: !!emailParams.text,
        hasHtml: !!emailParams.html,
      });

    await sendEmail(emailParams);

    // Kullanıcı bilgilerinden password alanını kaldır
    const { password: _, verificationToken: __, ...userWithoutSensitiveData } = createdUser;

    return NextResponse.json(
      { success: true, user: userWithoutSensitiveData, message: 'Kayıt başarılı. Lütfen email adresinizi kontrol edin.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 