import { Category } from "@shared/schemas";

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  const categories: Category[] = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
    {
      cache: 'no-store',
    }
  ).then(res => res.json());

  const categoryUrls = categories.map((category: Category) => ({
    url: `${siteUrl}/kategori/${category.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...categoryUrls,
  ];
}