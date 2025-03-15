import React from "react";
import Link from "next/link";
import { Category, Listing } from "@shared/schemas";
import CategoryDetailClient from "@/views/root/category";
import { cn } from "@/lib/utils";
import cityList from "../../../../public/city-list.json";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string; city?: string };
  searchParams: { page?: string; search?: string };
}) {
  const category = await getCategoryDetail(params.slug);
  const city = params.city || "";
  return {
    title: `${city ? `${city} ` : ""}${category.name} İlanları - Sayfa ${searchParams.page || 1}`,
    description: `En güncel ${category.name} ilanlarını ${city || "tüm şehirlerde"} keşfedin.`,
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
  return res.json() as Promise<{ listings: Listing[] }>;
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

  const { listings } = await getListings(params.slug, city, page, search);

  const sortedListings = listings.sort((a, b) => {
    if (a.listingType === "premium" && b.listingType !== "premium") return -1;
    if (a.listingType !== "premium" && b.listingType === "premium") return 1;
    return (
      new Date(b.createdAt || Date.now()).getTime() -
      new Date(a.createdAt || Date.now()).getTime()
    );
  });

  return (
    <div className="py-8">
            <CategoryDetailClient
        categories={categories}
        category={category}
        params={params}
        searchParams={searchParams}
        cityList={cityList.cities}
      />
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          {city
            ? `${city.charAt(0).toUpperCase() + city.slice(1)} ${category.name} İlanları`
            : `${category.name} İlanları`}
        </h1>
      </div>

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
              <p className="text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
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
      {listings && listings.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/kategori/${params.slug}${city ? `/${city}` : ""}${
                  page === 2 ? "" : `/${page - 1}`
                }${search ? `?search=${search}` : ""}`}
                className="px-4 py-2 rounded-md bg-white hover:bg-gray-100"
              >
                ←
              </Link>
            )}
            {Array.from(
              { length: Math.min(5, Math.ceil(listings.length / 10)) },
              (_, i) => {
                const pageNum = page > 3 ? page - 3 + i : i + 1;
                if (pageNum > Math.ceil(listings.length / 10)) return null;

                const cityPath = city ? `/${city}` : "";
                const pagePath = pageNum === 1 ? "" : `/${pageNum}`;
                const searchPath = search ? `?search=${encodeURIComponent(search)}` : "";

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
            {page < Math.ceil(listings.length / 10) && (
              <Link
                href={`/kategori/${params.slug}${city ? `/${city}` : ""}/${page + 1}${
                  search ? `?search=${search}` : ""
                }`}
                className="px-4 py-2 rounded-md bg-white hover:bg-gray-100"
              >
                →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const createSeoUrl = (title: string): string =>
  title.toLowerCase().replace(/ /g, "-");