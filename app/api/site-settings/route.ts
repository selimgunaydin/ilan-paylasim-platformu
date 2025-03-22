import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from "@shared/db";
import { site_settings } from '@shared/schemas';

export const dynamic = 'force-dynamic';

// Public site settings getter API
export async function GET(request: NextRequest) {
  try {
    // Get existing settings
    const [settings] = await db
      .select()
      .from(site_settings)
      .limit(1);

    // If no settings exist, return default values
    if (!settings) {
      return NextResponse.json({
        site_name: "İlan Platformu",
        site_logo: "",
        site_favicon: "",
        home_title: "İlan Platformu - İkinci El Alışveriş ve İlan Platformu",
        home_description: "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
        contact_email: "info@example.com",
        contact_phone: "+90 212 123 45 67",
        contact_address: "Örnek Mahallesi, Örnek Caddesi No:1, İstanbul",
        footer_text: "© 2024 İlan Platformu. Tüm hakları saklıdır.",
        facebook_url: "",
        twitter_url: "",
        instagram_url: "",
        linkedin_url: "",
        youtube_url: "",
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Site ayarları getirme hatası:", error);
    return NextResponse.json(
      { error: "Site ayarları yüklenemedi" },
      { status: 500 }
    );
  }
} 