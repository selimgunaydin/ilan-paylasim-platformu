import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db';
import { users } from '@shared/schemas';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Kayıt API'si
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, ip_address } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı, email ve şifre gereklidir' },
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
      return NextResponse.json(
        { success: false, message: 'Bu email adresi zaten kullanımda' },
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

    // Email doğrulama bağlantısı gönderme işlemi burada yapılabilir
    // ... (email gönderme kodu)

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