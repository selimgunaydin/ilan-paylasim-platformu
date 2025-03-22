import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route"; // Adjust path as needed
import { headers } from "next/headers";
import Link from "next/link";
import type { Category } from "@shared/schemas";
import ListingDetailClient from "@/views/root/ilan-detay";
import NotFound from "@/not-found";
import { Metadata } from "next";
import { getListingImageUrlClient } from "@/utils/get-message-file-url";
import AddFavorites from "@/views/root/ilan-detay/add-favorites";
import { createSeoUrl } from "@/utils/create-seo-url";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const id = params.slug?.split("-").pop();
  if (!id || isNaN(Number(id))) {
    return {
      title: "Geçersiz İlan | Site Adı",
      description: "Bu ilan ID'si geçersiz veya bulunamadı.",
    };
  }

  try {
    const headersList = headers();
    const cookies = headersList.get("cookie") || "";
    const listing = await fetchListing(id, cookies);
    const categories = await fetchCategories(cookies);
    const category = categories.find((c) => c.id === listing.categoryId);

    const title = `${listing.title} | ${listing.city} | Site Adı`;
    const description = listing.description
      ? `${listing.description.substring(0, 160)}...`
      : `${listing.title} - ${listing.city} şehrinde bu ilanı keşfedin.`;

    // Create SEO-friendly canonical URL from slug
    const canonicalUrl = `https://ilandaddy.com/ilan/${createSeoUrl(
      listing.title
    )}-${listing.id}`;

    return {
      title,
      description,
      keywords: `${listing.title}, ${listing.city}, ${
        category ? category.name : ""
      }, ikinci el, ilan`,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "article",
        images: listing.images?.[0] ? [listing.images[0]] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: listing.images?.[0] ? [listing.images[0]] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    return {
      title: "İlan Bulunamadı | Site Adı",
      description: "Bu ilan yüklenemedi veya mevcut değil.",
    };
  }
}

async function fetchListing(id: string, cookies: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${id}`,
    {
      headers: {
        Cookie: cookies || "",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("İlan yüklenemedi");
  return res.json() as Promise<any>;
}

async function fetchCategories(cookies: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    headers: {
      Cookie: cookies || "",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Kategoriler yüklenemedi");
  return res.json() as Promise<Category[]>;
}

async function fetchSimilarListings(categoryId: string, cookies: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/listings?categoryId=${categoryId}&limit=5`,
    {
      headers: {
        Cookie: cookies || "",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Benzer ilanlar yüklenemedi");
  return res.json() as Promise<{ listings: any }>;
}

async function fetchFavoriteStatus(
  id: string,
  userId: string | undefined,
  cookies: string
) {
  if (!userId) return { isFavorite: false };
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/check/${id}`,
    {
      headers: {
        Cookie: cookies || "",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Favori durumu kontrol edilemedi");
  return res.json() as Promise<{ isFavorite: boolean }>;
}

export default async function ListingDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  const cookies = headersList.get("cookie") || "";

  const id = params.slug?.split("-").pop();
  if (!id || isNaN(Number(id))) {
    return <div className="p-8 text-center">Geçersiz ilan ID'si</div>;
  }

  try {
    // Fetch all necessary data on the server
    const listing = await fetchListing(id, cookies);
    const [categories, similarListingsResponse, favoriteStatus] =
      await Promise.all([
        fetchCategories(cookies),
        fetchSimilarListings(listing.categoryId, cookies),
        fetchFavoriteStatus(id, session?.user?.id, cookies),
      ]);

    if (listing.active === false || listing.approved === false) {
      return (
        <div className="p-8 text-center">
          <NotFound />
        </div>
      );
    }

    const category = categories.find((c) => c.id === listing.categoryId);
    const parentCategory = category?.parentId
      ? categories.find((c) => c.id === category.parentId)
      : null;

    // Create structured data for Product and Review schemas
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        // Product Schema
        {
          "@type": "Product",
          name: listing.title,
          description: listing.description,
          image:
            listing.images?.length > 0
              ? getListingImageUrlClient(listing.images[0])
              : null,
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            price: "0",
            priceCurrency: "TRY",
          },
          category: category?.name,
          brand: {
            "@type": "Brand",
            name: "İlanDaddy",
          },
          // Default Review Schema
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5",
            reviewCount: "1",
            bestRating: "5",
            worstRating: "1",
          },
          review: {
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
            },
            author: {
              "@type": "Person",
              name: "İlanDaddy Kullanıcı",
            },
          },
        },
        // BreadcrumbList Schema
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Anasayfa",
              item: "https://ilandaddy.com/",
            },
            ...(parentCategory
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: parentCategory.name,
                    item: `https://ilandaddy.com/kategori/${parentCategory.slug}`,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: parentCategory ? 3 : 2,
              name: category?.name || "Kategori",
              item: `https://ilandaddy.com/kategori/${category?.slug || ""}`,
            },
            {
              "@type": "ListItem",
              position: parentCategory ? 4 : 3,
              name: listing.title,
              item: `https://ilandaddy.com/ilan/${createSeoUrl(
                listing.title
              )}-${listing.id}`,
            },
          ],
        },
      ],
    };

    // Format date for display
    const formattedDate = listing.createdAt
      ? new Date(listing.createdAt).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Tarih bilgisi yok";

    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-4 sm:py-8">
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Breadcrumb Navigation - Redesigned with better spacing and style */}
          <nav className="flex items-center mb-4 sm:mb-6 text-xs sm:text-sm bg-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-sm overflow-x-auto whitespace-nowrap">
            <Link
              href="/"
              className="text-gray-500 hover:text-blue-600 flex items-center flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Anasayfa</span>
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mx-1 sm:mx-2 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>

            {parentCategory && (
              <>
                <Link
                  href={`/kategori/${parentCategory.slug}`}
                  className="text-gray-500 hover:text-blue-600 flex-shrink-0"
                >
                  {parentCategory.name}
                </Link>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mx-1 sm:mx-2 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}

            {category && (
              <>
                <Link
                  href={`/kategori/${category.slug}`}
                  className="text-gray-500 hover:text-blue-600 flex-shrink-0"
                >
                  {category.name}
                </Link>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mx-1 sm:mx-2 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}

            <span className="text-gray-800 font-medium truncate">
              {listing.title.length > 25
                ? `${listing.title.substring(0, 25)}...`
                : listing.title}
            </span>
          </nav>

          {/* Main Content Area - New Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Gallery & Main Info */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Listing Header with Premium Badge */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="w-full flex items-center justify-between gap-2">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                        {listing.title}
                      </h1>
                      <AddFavorites id={listing.id} listing={listing} />
                    </div>
                    {listing.listingType === "premium" && (
                      <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-amber-100 text-amber-800 w-max">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                        Öncelikli İlan
                      </span>
                    )}
                  </div>

                  {/* Listing Meta Information */}
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center text-xs sm:text-sm text-gray-500 gap-3 sm:gap-x-6 sm:gap-y-2">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {listing.city}
                    </div>

                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formattedDate}
                    </div>

                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {listing.views || 0} görüntülenme
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <ListingDetailClient
                  listing={{
                    ...listing,
                    categoryName: category?.name || "",
                  }}
                  user={session?.user || null}
                  initialFavoriteStatus={favoriteStatus.isFavorite}
                  slug={params.slug}
                />
              </div>

              {/* Listing Description */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-3 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  İlan Detayları
                </h2>
                <div className="prose max-w-none">
                  {listing.description ? (
                    <div dangerouslySetInnerHTML={{ __html: listing.description }} className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 leading-relaxed">
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm sm:text-base">
                      Bu ilan için detay bilgisi bulunmuyor.
                    </p>
                  )}
                </div>
              </div>

              {/* Similar Listings */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden p-3 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                  Benzer İlanlar
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  {similarListingsResponse.listings
                    ?.filter(
                      (l: any) =>
                        l.id !== listing.id && l.listingType === "premium"
                    )
                    .slice(0, 4)
                    .map((similarListing: any) => (
                      <Link
                        key={similarListing.id}
                        href={`/ilan/${createSeoUrl(similarListing.title)}-${
                          similarListing.id
                        }`}
                        className="group"
                      >
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md group-hover:border-blue-300">
                          <div className="p-3 sm:p-4">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1 sm:mb-2 line-clamp-1 text-sm sm:text-base">
                              {similarListing.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                              {similarListing.description}
                            </p>
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {similarListing.city}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>

                {similarListingsResponse.listings?.filter(
                  (l: any) => l.id !== listing.id
                ).length === 0 && (
                  <p className="text-gray-500 text-center py-4 text-sm sm:text-base">
                    Bu kategoride başka ilan bulunmuyor.
                  </p>
                )}

                {similarListingsResponse.listings?.filter(
                  (l: any) => l.id !== listing.id
                ).length > 4 && (
                  <div className="mt-4 text-center">
                    <Link
                      href={`/kategori/${category?.slug || ""}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
                    >
                      Daha fazla ilan gör
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Contact & Additional Info - Visible as Bottom Section on Mobile */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-6 py-3 sm:py-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    İletişim Bilgileri
                  </h2>
                </div>
                <div className="p-3 sm:p-6 divide-y divide-gray-200">
                  {listing.contactPerson && (
                    <div className="py-2 sm:py-3 flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          İlan Sahibi
                        </p>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {listing.contactPerson}
                        </p>
                      </div>
                    </div>
                  )}

                  {listing.phone && (
                    <div className="py-2 sm:py-3 flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Telefon
                        </p>
                        <a
                          href={`tel:${listing.phone}`}
                          className="font-medium text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
                        >
                          {listing.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="py-2 sm:py-3 flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Konum</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {listing.city}
                      </p>
                    </div>
                  </div>

                  <div className="py-2 sm:py-3 flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-gray-400 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Kategori
                      </p>
                      <Link
                        href={`/kategori/${category?.slug || ""}`}
                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
                      >
                        {category?.name || "Genel"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden border border-blue-100">
                <div className="p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    İlan Sahibi ile İletişime Geç
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Bu ilan ile ilgili daha fazla bilgi için ilan sahibine
                    ulaşın.
                  </p>

                  {listing.phone ? (
                    <a
                      href={`tel:${listing.phone}`}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center transition-colors text-sm sm:text-base"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Ara
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white font-medium py-2 px-4 rounded flex items-center justify-center cursor-not-allowed text-sm sm:text-base"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      İletişim bilgisi bulunmuyor
                    </button>
                  )}
                </div>
              </div>

              {/* Safety Tips */}
              <div className="bg-yellow-50 rounded-xl shadow-sm overflow-hidden border border-yellow-100">
                <div className="p-3 sm:p-6">
                  <h3 className="text-sm sm:text-md font-semibold text-yellow-800 mb-2 sm:mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Güvenlik İpuçları
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-yellow-800">
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      İlanı görmeden veya ürünü incelemeden ödeme yapmayın
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Şüpheli durumları site yönetimine bildirin
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Kişisel bilgilerinizi paylaşmaktan kaçının
                    </li>
                  </ul>
                </div>
              </div>

              {/* Ad Space - Styled Better */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md overflow-hidden">
                <div className="p-3 sm:p-6 text-white">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Öne Çıkan
                    </h3>
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                      Reklam
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 mb-3 sm:mb-4">
                    Siz de ilanınızı öne çıkarmak ister misiniz? Premium üyelik
                    ile ilanlarınız daha fazla kişiye ulaşsın!
                  </p>
                  <a
                    href="/premium-uyelik"
                    className="block w-full bg-white text-purple-700 text-center font-medium py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg hover:bg-purple-50 transition-colors text-xs sm:text-sm"
                  >
                    Daha Fazla Bilgi
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ListingDetailPage:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-3 bg-white shadow-lg rounded-lg p-6 sm:p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-3 sm:mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            İlan Yüklenemedi
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            İlan bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar
            deneyin.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }
}