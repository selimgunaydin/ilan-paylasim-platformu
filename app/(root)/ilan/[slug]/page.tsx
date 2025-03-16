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
    const canonicalUrl = `https://ilandaddy.com/ilan/${createSeoUrl(listing.title)}-${listing.id}`;

    return {
      title,
      description,
      keywords: `${listing.title}, ${listing.city}, ${category ? category.name : ''}, ikinci el, ilan`,
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
      }
    };
  } catch (error) {
    return {
      title: "İlan Bulunamadı | Site Adı",
      description: "Bu ilan yüklenemedi veya mevcut değil.",
    };
  }
}

async function fetchListing(id: string, cookies: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${id}`, {
    headers: {
      "Cookie": cookies || "",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("İlan yüklenemedi");
  return res.json() as Promise<any>;
}

async function fetchCategories(cookies: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    headers: {
      "Cookie": cookies || "",
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
        "Cookie": cookies || "",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Benzer ilanlar yüklenemedi");
  return res.json() as Promise<{ listings: any }>;
}

async function fetchFavoriteStatus(id: string, userId: string | undefined, cookies: string) {
  if (!userId) return { isFavorite: false };
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/check/${id}`, {
    headers: {
      "Cookie": cookies || "",
    },
    cache: "no-store",
  });
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
    const [categories, similarListingsResponse, favoriteStatus] = await Promise.all([
      fetchCategories(cookies),
      fetchSimilarListings(listing.categoryId, cookies),
      fetchFavoriteStatus(id, session?.user?.id, cookies),
    ]);

    if(listing.active === false || listing.approved === false){
      return <div className="p-8 text-center">
        <NotFound />
      </div>;
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
          "name": listing.title,
          "description": listing.description,
          "image": listing.images?.length > 0 ? getListingImageUrlClient(listing.images[0]) : null,
          "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "price": "0",
            "priceCurrency": "TRY"
          },
          "category": category?.name,
          "brand": {
            "@type": "Brand",
            "name": "İlanDaddy"
          },
          // Default Review Schema
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "reviewCount": "1",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": {
            "@type": "Review",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "İlanDaddy Kullanıcı"
            }
          }
        },
        // BreadcrumbList Schema
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Anasayfa",
              "item": "https://ilandaddy.com/"
            },
            ...(parentCategory ? [{
              "@type": "ListItem",
              "position": 2,
              "name": parentCategory.name,
              "item": `https://ilandaddy.com/kategori/${parentCategory.slug}`
            }] : []),
            {
              "@type": "ListItem",
              "position": parentCategory ? 3 : 2,
              "name": category?.name || "Kategori",
              "item": `https://ilandaddy.com/kategori/${category?.slug || ""}`
            },
            {
              "@type": "ListItem",
              "position": parentCategory ? 4 : 3,
              "name": listing.title,
              "item": `https://ilandaddy.com/ilan/${createSeoUrl(listing.title)}-${listing.id}`
            }
          ]
        }
      ]
    };

    return (
      <div className="py-8">
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Anasayfa</Link>
          <span className="mx-2">/</span>
          {parentCategory && (
            <>
              <Link href={`/kategori/${parentCategory.slug}`} className="hover:text-blue-600">
                {parentCategory.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          {category && (
            <>
              <Link href={`/kategori/${category.slug}`} className="hover:text-blue-600">
                {category.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900">{listing.title}</span>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div className="md:col-span-2">
            {/* Listing Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  {listing.listingType === "premium" && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded">Öncelikli İlan</span>
                  )}
                </div>
                {/* The static preview image is now removed as we're using the gallery */}
              </div>
              <div className="prose max-w-none px-6">
                <p className="whitespace-pre-wrap text-lg">{listing.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <ListingDetailClient
                listing={{
                  ...listing,
                  // Add category name for client component to use in image titles
                  categoryName: category?.name || ""
                }}
                user={session?.user || null}
                initialFavoriteStatus={favoriteStatus.isFavorite}
                slug={params.slug}
              />
            </div>

            {/* Similar Listings */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Benzer İlanlar</h2>
                <div className="space-y-4">
                  {similarListingsResponse.listings
                    ?.filter((l:any) => l.id !== listing.id && l.listingType === "premium")
                    .slice(0, 5)
                    .map((similarListing:any) => (
                      <Link
                        key={similarListing.id}
                        href={`/ilan/${createSeoUrl(similarListing.title)}-${similarListing.id}`}
                        className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
                      >
                        <h3 className="font-semibold mb-2">{similarListing.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{similarListing.description}</p>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Listing Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">İlan Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Güncelleme Tarihi</p>
                  <p className="font-medium">
                    {listing.createdAt
                      ? new Date(listing.createdAt).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Tarih bilgisi yok"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Şehir</p>
                  <p className="font-medium">{listing.city}</p>
                </div>
                {listing.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-500">İlan Sahibi</p>
                    <p className="font-medium">{listing.contactPerson}</p>
                  </div>
                )}
                {listing.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{listing.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">İlan Görüntülenme</p>
                  <p className="font-medium">{listing.views || 0}</p>
                </div>
              </div>
            </div>

            {/* Ad Space */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Reklam Alanı</h3>
              <p className="text-sm opacity-90">
                Bu alanda sponsorlu içerik veya reklam gösterilebilir
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ListingDetailPage:", error);
    return <div className="p-8 text-center">İlan yüklenirken bir hata oluştu</div>;
  }
}

const createSeoUrl = (title: string): string =>
  title.toLowerCase().replace(/ /g, "-");