import { NextResponse } from "next/server";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  // robots.txt içeriği (isProduction kontrolü olmadan)
  const robotsTxt = `
User-agent: *
Disallow: /yonetim/  
Disallow: /api/       
Disallow: /auth/    
Disallow: /private/   
Disallow: /reset-password/  
Disallow: /verify-email/   
Allow: /            
Allow: /ilan/        
Allow: /kategori/    
Sitemap: ${siteUrl}/sitemap.xml
  `.trim();

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8", // UTF-8 kodlaması
      "Cache-Control": "public, max-age=86400",    // 1 gün önbellekleme
    },
  });
}