import React from "react";
import HomePage from "@/views/root/home";
import { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  slug: string;
  order: number;
  customTitle: string | null;
  metaDescription: string | null;
  content: string | null;
  faqs: string | null;
  listingCount: number;
  children: Category[];
}

// Category tipini genişleterek listingCount özelliğini opsiyonel olarak ekleyelim
interface CategoryWithCount extends Category {
  listingCount: number;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  return {
    title: settings.home_title,
    description: settings.home_description,
    keywords: "ikinci el, ilan, alışveriş, kategoriler, fırsatlar",
    openGraph: {
      title: settings.home_title,
      description: settings.home_description,
      url: siteUrl,
      type: "website",
      images: [`${siteUrl}/og-image.jpg`],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.home_title,
      description: settings.home_description,
      images: [`${siteUrl}/og-image.jpg`],
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export default async function Home() {
  const categories: CategoryWithCount[] = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/categories/all`,
    {
      cache: 'no-store'
    }
  ).then(res => res.json());

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  const settings = await getSiteSettings();

  // Schema.org yapısı
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage", // Ana sayfa bir koleksiyon sayfası olarak tanımlanıyor
    name: settings.home_title,
    description: settings.home_description,
    url: siteUrl,
    publisher: {
      "@type": "Organization",
      name: settings.site_name,
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