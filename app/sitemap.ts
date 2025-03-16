import { Category } from "@shared/schemas";
import { safeFetch } from "@shared/utils/fetch-helper";

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  const categories = await safeFetch<Category[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
    undefined,
    []
  );

  const categoryUrls = categories.map((category) => ({
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