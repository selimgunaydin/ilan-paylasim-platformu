"use client";

import type { Category, Listing } from "@shared/schemas";
import Link from "next/link";
import { cn, createSeoUrl } from "@/lib/utils";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@app/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import cityList from "../../public/city-list.json";

export default function CategoryDetail({
  categories,
  category,
  listings,
  params,
  searchParams,
}: {
  categories: Category[];
  category: Category;
  listings: Listing[];
  params: { slug: string; city: string };
  searchParams: { page?: string; search?: string };
}) {
  const page = !isNaN(parseInt(searchParams.page || "1"))
    ? parseInt(searchParams.page || "1")
    : 1;

  const sortedListings = listings.sort((a, b) => {
    if (a.listingType === "premium" && b.listingType !== "premium") return -1;
    if (a.listingType !== "premium" && b.listingType === "premium") return 1;
    return (
      new Date(b.createdAt || Date.now()).getTime() -
      new Date(a.createdAt || Date.now()).getTime()
    );
  });

  if (!category) return <div>Yükleniyor...</div>;

  return (
    <div className="py-8">
      {/* Arama formu düzenlemesi */}
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const category = form.category.value;
            const city = form.city.value;

            if (!category) return;

            const normalizedCity = city
              ? `/${decodeURIComponent(city.toLowerCase())}`
              : "";
            const url = `/kategori/${category}${normalizedCity}`;
            window.location.href = url;
          }}
          // Mobil görünümde dikey, masaüstünde yatay yerleşim için flex yapılandırması
          className="flex flex-col md:flex-row gap-4"
        >
          {/* Kategori seçimi - tam genişlik kullanımı */}
          <div className="w-full md:flex-1">
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Kategori Seç" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  ?.filter((c) => !c.parentId)
                  .map((mainCategory) => (
                    <SelectGroup key={mainCategory.id}>
                      <SelectLabel className="font-semibold text-sm text-gray-700">
                        {mainCategory.name}
                      </SelectLabel>
                      {categories
                        ?.filter((c) => c.parentId === mainCategory.id)
                        .map((subCategory) => (
                          <SelectItem
                            key={subCategory.id}
                            value={subCategory.slug}
                          >
                            {subCategory.name}
                          </SelectItem>
                        ))}
                      <SelectSeparator />
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {/* Şehir seçimi - tam genişlik kullanımı */}
          <div className="w-full md:flex-1">
            <Select name="city">
              <SelectTrigger>
                <SelectValue placeholder="Tüm Şehirler" />
              </SelectTrigger>
              <SelectContent>
                {cityList.cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Arama butonu - mobilde tam genişlik */}
          <Button
            type="submit"
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8"
          >
            Ara
          </Button>
        </form>
      </div>
      {/* Alt taraftaki başlık ve arama alanı bölümü */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          {params.city
            ? `${params.city.charAt(0).toUpperCase() + params.city.slice(1)} ${
                category.name
              } İlanları`
            : `${category.name} İlanları`}
        </h1>
        {/* Arama kutusu - mobilde tam genişlik */}
        <div className="w-full md:w-auto">
          <input
            type="search"
            placeholder="İlanlarda ara..."
            className="w-full md:w-[300px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={searchParams.search || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const searchQuery = e.currentTarget.value;
                const cityParam = params.city ? `/${params.city}` : "";
                const baseUrl = `/kategori/${params.slug}${cityParam}`;
                const searchParam = searchQuery.trim()
                  ? `?search=${encodeURIComponent(searchQuery.trim())}`
                  : "";
                window.location.href = baseUrl + searchParam;
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        {!sortedListings?.length && listings?.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 text-lg">
              {searchParams.search
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
                <Badge className="absolute top-4 right-4 bg-yellow-500">
                  Öncelikli İlan
                </Badge>
              )}
              <Link
                href={`/ilan/${createSeoUrl(listing.title)}-${listing.id}`}
                className="hover:text-blue-600"
              >
                <h2 className="text-xl font-semibold mb-2">{listing.title}</h2>
              </Link>
              <p className="text-gray-600 mb-3 line-clamp-2">
                {listing.description}
              </p>
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
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="text-gray-500"
                    />
                    {listing.city}
                  </Link>
                  {category.parentId === null && (
                    <>
                      <span className="text-gray-400"> - </span>
                      <Link
                        href={`/kategori/${
                          categories?.find((c) => c.id === listing.categoryId)
                            ?.slug || ""
                        }`}
                        className="hover:text-blue-500"
                      >
                        {
                          categories?.find((c) => c.id === listing.categoryId)
                            ?.name
                        }
                      </Link>
                    </>
                  )}
                </div>
                <span>
                  {formatDistanceToNow(
                    new Date(listing.createdAt || Date.now()),
                    {
                      addSuffix: true,
                      locale: tr,
                    }
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {listings && listings.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/kategori/${params.slug}${
                  page === 2 ? "" : `/${page - 1}`
                }`}
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

                const cityPath = params.city ? `/${params.city}` : "";
                const pagePath = pageNum === 1 ? "" : `/${pageNum}`;
                const searchPath = searchParams.search
                  ? `?search=${searchParams.search}`
                  : "";

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
                href={`/kategori/${params.slug}/${page + 1}`}
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
