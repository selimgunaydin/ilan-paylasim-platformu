import React from "react";
import HomePage from "@/views/root/home";
import { Category } from "@shared/schemas";
import { safeFetch } from "@shared/utils/fetch-helper";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 saatte bir yenile (ISR)

export async function generateMetadata(): Promise<Metadata> {
  const siteName = "İlan Daddy";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  return {
    title: `${siteName} - İkinci El Alışveriş ve İlan Platformu`,
    description:
      "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu. Hemen keşfedin ve fırsatları yakalayın!",
    keywords: "ikinci el, ilan, alışveriş, kategoriler, fırsatlar, İlan Daddy",
    openGraph: {
      title: `${siteName} - İkinci El Alışveriş ve İlan Platformu`,
      description:
        "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
      url: siteUrl,
      type: "website",
      images: [`${siteUrl}/og-image.jpg`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - İkinci El Alışveriş ve İlan Platformu`,
      description:
        "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
      images: [`${siteUrl}/og-image.jpg`],
    },
    alternates: {
      canonical: siteUrl,
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

  // Schema.org yapısı
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage", // Ana sayfa bir koleksiyon sayfası olarak tanımlanıyor
    name: "İlan Daddy - İkinci El Alışveriş ve İlan Platformu",
    description:
      "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
    url: siteUrl,
    publisher: {
      "@type": "Organization",
      name: "İlan Daddy",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((category, index) => ({
        "@type": "Category",
        position: index + 1,
        name: category.name,
        url: `${siteUrl}/kategori/${category.slug}`,
      })),
    },
  };

  return (
    <>
      <HomePage categories={categories} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData, null, 2), // Daha okunabilir bir çıktı için 2 boşluklu biçimlendirme
        }}
      />
    </>
  );
}