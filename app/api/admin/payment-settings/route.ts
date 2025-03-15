import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { payment_settings } from '@shared/schemas';
import { insertPaymentSettingsSchema } from '@shared/schemas';
import jwt from 'jsonwebtoken';
import { checkAdminAuth } from '@/utils/check-admin';

export const dynamic = 'force-dynamic';

// Ödeme ayarlarını getirme API'si
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

    // Mevcut ayarları getir
    const [settings] = await db
      .select()
      .from(payment_settings)
      .limit(1);

    // Eğer ayarlar yoksa varsayılan değerlerle oluştur
    if (!settings) {
      const [newSettings] = await db
        .insert(payment_settings)
        .values({
          premium_listing_price: 0,
          listing_duration: 30,
          premium_member_price: 0,
          default_payment_gateway: "paytr",
          paytr_merchant_id: "",
          paytr_secret_key: "",
          paytr_merchant_key: "",
          paytr_sandbox: true,
          iyzico_api_key: "",
          iyzico_secret_key: "",
          iyzico_base_url: "https://sandbox-api.iyzipay.com",
          stripe_public_key: "",
          stripe_secret_key: "",
          stripe_webhook_secret: "",
          stripe_currency: "try",
          updated_by: Number(admin.userId),
        })
        .returning();

      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Ödeme ayarları getirme hatası:", error);
    return NextResponse.json(
      { error: "Ödeme ayarları yüklenemedi" },
      { status: 500 }
    );
  }
}

// Ödeme ayarlarını güncelleme API'si
export async function PUT(request: NextRequest) {
  try {
    // Admin yetkisi kontrolü
    const admin = await checkAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Gelen verileri al
    const body = await request.json();
    
    // Verileri doğrula
    try {
      const validatedData = insertPaymentSettingsSchema.parse(body);
      
      // Mevcut ayarları kontrol et
      let [existingSettings] = await db
        .select()
        .from(payment_settings)
        .limit(1);

      // Verileri güncelle veya yeni kayıt oluştur
      if (existingSettings) {
        // Mevcut kaydı güncelle
        [existingSettings] = await db
          .update(payment_settings)
          .set({
            ...validatedData,
            updated_by: Number(admin.userId),
            updated_at: new Date(),
          })
          .returning();
      } else {
        // Yeni kayıt oluştur
        [existingSettings] = await db
          .insert(payment_settings)
          .values({
            ...validatedData,
            updated_by: Number(admin.userId),
            updated_at: new Date(),
          })
          .returning();
      }

      return NextResponse.json(existingSettings);
    } catch (validationError) {
      console.error("Ödeme ayarları validasyon hatası:", validationError);
      return NextResponse.json(
        { 
          error: "Geçersiz ödeme ayarları", 
          details: validationError instanceof Error ? validationError.message : String(validationError)
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Ödeme ayarları güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Ödeme ayarları güncellenemedi" },
      { status: 500 }
    );
  }
} 