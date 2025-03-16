import React from "react";
import HomePage from "@/views/root/home";
import { Category } from "@shared/schemas";
import { safeFetch } from "@shared/utils/fetch-helper";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 saatte bir yenile (ISR - Incremental Static Regeneration)

import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const siteName = "İlan Daddy"; // Sitenizin adını buraya ekleyin
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  return {
    title: `${siteName} - İkinci El Alışveriş ve İlan Platformu`, // Anahtar kelime odaklı başlık
    description:
      "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu. Hemen keşfedin ve fırsatları yakalayın!",
    keywords: "ikinci el, ilan, alışveriş, kategoriler, fırsatlar, site adı", // Anahtar kelimeler
    openGraph: {
      title: `${siteName} - İkinci El Alışveriş ve İlan Platformu`,
      description:
        "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
      url: siteUrl,
      type: "website",
      images: [`${siteUrl}/og-image.jpg`], // Sosyal medya için bir görsel ekleyin
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - İkinci El Alışveriş ve İlan Platformu`,
      description:
        "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
      images: [`${siteUrl}/og-image.jpg`],
    },
    alternates: {
      canonical: siteUrl, // Kanonik URL ile kopya içerik sorununu önler
    },
  };
}

export default async function Home() {
  const categories = await safeFetch<Category[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
    undefined,
    []
  );

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  return (
    <>
      <HomePage categories={categories} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: categories.map((category, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: category.name,
              url: `${siteUrl}/kategori/${category.slug}`,
            })),
          }),
        }}
      />
    </>
  );
}
