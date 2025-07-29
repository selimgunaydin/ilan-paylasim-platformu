import React from "react";
import Link from "next/link";
import { Category, Listing } from "@shared/schemas";
import CategoryDetailClient from "@/views/root/category";
import { cn } from "@/utils";
import { getCityOptions } from "../../../../lib/constants";
import { Metadata } from "next";
import { FaqAccordion, type FaqItem } from "@app/components/FaqAccordion";
import { createSeoUrl } from "@/utils/create-seo-url";
// Helper to parse FAQs from string
const parseFaqs = (faqsString?: string | null): FaqItem[] => {
  if (!faqsString) return [];
  try {
    return JSON.parse(faqsString);
  } catch (e) {
    console.error("Failed to parse FAQs", e);
    return [];
  }
};

// Updated metadata generation
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string; city?: string };
  searchParams: { page?: string; search?: string };
}): Promise<Metadata> {
  const category = await getCategoryDetail(params.slug);
  const city = params.city || "";
  const page = searchParams.page || "1";
  
  // Use custom title if available, otherwise use default format
  const title = category.customTitle 
    ? `${city ? `${city} ` : ""}${category.customTitle} - Sayfa ${page}`
    : `${city ? `${city} ` : ""}${category.name} İlanları - Sayfa ${page}`;
  
  // Use custom meta description if available, otherwise use default
  const description = category.metaDescription 
    ? `${category.metaDescription} ${city ? `${city} bölgesinde` : ""}`
    : `En güncel ${category.name} ilanlarını ${city || "tüm şehirlerde"} keşfedin.`;
  
  const canonical = city 
    ? `https://ilandaddy.com/kategori/${params.slug}/${city}`
    : `https://ilandaddy.com/kategori/${params.slug}`;
  
  return {
    title,
    description,
    alternates: {
      canonical: canonical,
    }
  };
}

async function getCategories() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Kategoriler yüklenemedi");
  return res.json() as Promise<Category[]>;
}

async function getCategoryDetail(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Kategori detayları yüklenemedi");
  return res.json() as Promise<Category>;
}

async function getListings(
  categorySlug: string,
  city: string,
  page: number,
  search: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/listings?categorySlug=${categorySlug}&city=${city}&page=${page}&search=${search}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("İlanlar yüklenemedi");
  return res.json() as Promise<{ listings: Listing[]; total: number }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string; city?: string };
  searchParams: { page?: string; search?: string };
}) {
  const categories = await getCategories();
  const category = await getCategoryDetail(params.slug);

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || "";
  const city = params.city || "";

  const { listings, total } = await getListings(params.slug, city, page, search);

  const sortedListings = listings.sort((a, b) => {
    if (a.listingType === "premium" && b.listingType !== "premium") return -1;
    if (a.listingType !== "premium" && b.listingType === "premium") return 1;
    return (
      new Date(b.createdAt || Date.now()).getTime() -
      new Date(a.createdAt || Date.now()).getTime()
    );
  });

  // Parse FAQs from JSON string
  const faqs = parseFaqs(category.faqs);

  // Get parent category for breadcrumbs
  const parentCategory = category.parentId 
    ? categories.find(c => c.id === category.parentId) 
    : null;

  // Create breadcrumbs data
  const breadcrumbs = [
    { name: "Ana Sayfa", url: "/" },
    ...(parentCategory ? [{ name: parentCategory.name, url: `/kategori/${parentCategory.slug}` }] : []),
    { name: category.name, url: `/kategori/${category.slug}` },
    ...(city ? [{ name: city.charAt(0).toUpperCase() + city.slice(1), url: `/kategori/${category.slug}/${city}` }] : [])
  ];

  // Create JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      // BreadcrumbList Schema
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": `https://ilandaddy.com${item.url}`
        }))
      },
      // FAQ Schema (if FAQs exist)
      ...(faqs.length > 0 ? [{
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq: FaqItem) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }] : []),
      // ItemList Schema
      {
        "@type": "ItemList",
        "itemListElement": sortedListings.map((listing, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": listing.title,
            "description": listing.description,
            "url": `https://ilandaddy.com/ilan/${createSeoUrl(listing.title)}-${listing.id}`
          }
        }))
      },
      // WebSite with SearchAction Schema
      {
        "@type": "WebSite",
        "url": "https://ilandaddy.com/",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://ilandaddy.com/kategori/${params.slug}?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      // AggregateRating Schema (default 5)
      {
        "@type": "Product",
        "name": `${category.name} İlanları`,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5",
          "ratingCount": "1",
          "reviewCount": "1",
          "bestRating": "5"
        }
      }
    ]
  };

  const cityOptions = getCityOptions();

  return (
    <div className="py-8 container mx-auto">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <CategoryDetailClient
        categories={categories}
        category={category}
        params={params}
        searchParams={searchParams}
        cityList={cityOptions}
      />

      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 mb-4">
        {breadcrumbs.map((crumb, i) => (
          <span key={i}>
            {i > 0 && " / "}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-700">{crumb.name}</span>
            ) : (
              <Link href={crumb.url} className="hover:text-blue-600">
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          {city
            ? `${city.charAt(0).toUpperCase() + city.slice(1)} ${category.customTitle || category.name} İlanları`
            : `${category.customTitle || category.name} İlanları`}
        </h1>
      </div>

      {/* Category Content/Article (if exists) */}
      {category.content && (
        <div className="bg-white rounded-lg p-6 mb-6 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: category.content }} />
        </div>
      )}

      {/* Listings */}
      <div className="space-y-4">
        {!sortedListings?.length && listings?.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 text-lg">
              {search
                ? "Bu kelimeyi içeren ilan bulunamadı.."
                : "Henüz bu kategoride ilan eklenmemiş..."}
            </p>
          </div>
        ) : (
          sortedListings.map((listing) => (
            <div
              key={listing.id}
              className={cn(
                "border rounded-lg p-4 relative",
                listing.listingType === "premium"
                  ? "border-2 border-yellow-400 bg-yellow-50"
                  : "bg-white"
              )}
            >
              {listing.listingType === "premium" && (
                <span className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded">
                  Öncelikli İlan
                </span>
              )}
              <Link
                href={`/ilan/${createSeoUrl(listing.title)}-${listing.id}`}
                className="hover:text-blue-600"
              >
                <h2 className="text-xl font-semibold mb-2">{listing.title}</h2>
              </Link>
              <div dangerouslySetInnerHTML={{ __html: listing.description }} className="text-gray-600 mb-3 line-clamp-2" />
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/kategori/${
                      category.parentId === null ? category.slug : params.slug
                    }/${listing.city
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]/g, "")}`}
                    className="hover:text-blue-500 font-bold flex items-center gap-1"
                  >
                    <span className="text-gray-500">📍</span>
                    {listing.city}
                  </Link>
                  {category.parentId === null && (
                    <>
                      <span className="text-gray-400"> - </span>
                      <Link
                        href={`/kategori/${
                          categories?.find((c) => c.id === listing.categoryId)?.slug || ""
                        }`}
                        className="hover:text-blue-500"
                      >
                        {categories?.find((c) => c.id === listing.categoryId)?.name}
                      </Link>
                    </>
                  )}
                </div>
                <span>
                  {new Date(listing.createdAt || Date.now()).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {sortedListings.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/kategori/${params.slug}${city ? `/${city}` : ""}${
                  page === 2 ? "" : `?page=${page - 1}`
                }${search ? `&search=${search}` : ""}`}
                className="px-4 py-2 rounded-md bg-white hover:bg-gray-100"
              >
                ←
              </Link>
            )}
            {Array.from(
              { length: Math.min(5, Math.ceil(total / 10)) },
              (_, i) => {
                const pageNum = page > 3 ? page - 3 + i : i + 1;
                if (pageNum > Math.ceil(total / 10)) return null;

                const cityPath = city ? `/${city}` : "";
                const pagePath = pageNum === 1 ? "" : `?page=${pageNum}`;
                const searchPath = search ? `&search=${encodeURIComponent(search)}` : "";

                return (
                  <Link
                    key={pageNum}
                    href={`/kategori/${params.slug}${cityPath}${pagePath}${searchPath}`}
                    className={cn(
                      "px-4 py-2 rounded-md",
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </Link>
                );
              }
            )}
            {page < Math.ceil(total / 10) && (
              <Link
                href={`/kategori/${params.slug}${city ? `/${city}` : ""}?page=${page + 1}${
                  search ? `&search=${search}` : ""
                }`}
                className="px-4 py-2 rounded-md bg-white hover:bg-gray-100"
              >
                →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* FAQ Section with Accordion */}
      {faqs.length > 0 && (
        <div className="mt-8 bg-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
          <FaqAccordion faqs={faqs} />
        </div>
      )}
    </div>
  );
}